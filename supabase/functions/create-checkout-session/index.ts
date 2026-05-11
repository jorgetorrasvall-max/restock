import Stripe from 'npm:stripe@14'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Token inválido' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const { product_id } = await req.json()
  if (!product_id) {
    return new Response(JSON.stringify({ error: 'product_id requerido' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, title, price, active, sold, seller_id')
    .eq('id', product_id)
    .single()

  if (productError || !product) {
    return new Response(JSON.stringify({ error: 'Producto no encontrado' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  if (!product.active || product.sold) {
    return new Response(JSON.stringify({ error: 'Lote no disponible' }), {
      status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  if (product.seller_id === user.id) {
    return new Response(JSON.stringify({ error: 'No puedes comprar tu propio lote' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      product_id,
      buyer_id: user.id,
      buyer_email: user.email,
      amount: product.price * 100,
      status: 'pending'
    })
    .select('id')
    .single()

  if (orderError || !order) {
    return new Response(JSON.stringify({ error: 'Error creando orden' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
  const siteUrl = Deno.env.get('SITE_URL')!

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        unit_amount: product.price * 100,
        product_data: { name: product.title }
      },
      quantity: 1
    }],
    success_url: `${siteUrl}/ReStock-Producto/checkout-success.html?order=${order.id}`,
    cancel_url: `${siteUrl}/ReStock-Producto/producto.html?id=${product_id}`,
    metadata: { order_id: order.id, product_id }
  })

  await supabase
    .from('orders')
    .update({ stripe_session_id: session.id })
    .eq('id', order.id)

  return new Response(
    JSON.stringify({ url: session.url }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
