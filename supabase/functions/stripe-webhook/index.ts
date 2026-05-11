import Stripe from 'npm:stripe@14'
import { createClient } from 'npm:@supabase/supabase-js@2'

async function sendEmail(apiKey: string, to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'ReStock <noreply@restock.com>',
      to,
      subject,
      html
    })
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error:', err)
  }
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  if (!signature) {
    return new Response('Missing stripe-signature', { status: 400 })
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return new Response(`Webhook error: ${err.message}`, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response('OK', { status: 200 })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const { order_id, product_id } = session.metadata ?? {}

  if (!order_id || !product_id) {
    console.error('Missing metadata in session:', session.id)
    return new Response('Missing metadata', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .update({ status: 'paid' })
    .eq('id', order_id)
    .select('buyer_email')
    .single()

  if (orderError) {
    console.error('Error updating order:', orderError)
    return new Response('DB error', { status: 500 })
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .update({ sold: true, active: false })
    .eq('id', product_id)
    .select('title, price, seller_id')
    .single()

  if (productError) {
    console.error('Error updating product:', productError)
    return new Response('DB error', { status: 500 })
  }

  const { data: sellerAuth } = await supabase.auth.admin.getUserById(product.seller_id)
  const sellerEmail = sellerAuth?.user?.email

  const commissionRate = product.price >= 1000 ? 3 : product.price >= 500 ? 4 : 5
  const sellerReceives = product.price - Math.round(product.price * commissionRate / 100)

  const resendKey = Deno.env.get('RESEND_API_KEY')!

  await sendEmail(
    resendKey,
    order.buyer_email,
    'Tu compra en ReStock está confirmada',
    `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1A1A1A">
      <h2 style="font-size:20px;margin-bottom:8px">Compra confirmada</h2>
      <p style="color:#5C5C5C;margin-bottom:24px">Tu pago ha sido procesado correctamente.</p>
      <div style="background:#FDFBF7;border:1px solid #E8E4DC;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="font-size:14px;color:#5C5C5C;margin:0 0 4px">Lote comprado</p>
        <p style="font-size:16px;font-weight:600;margin:0 0 12px">${product.title}</p>
        <p style="font-size:14px;color:#5C5C5C;margin:0 0 4px">Importe pagado</p>
        <p style="font-size:20px;font-weight:700;color:#1A3C6E;margin:0">${product.price.toLocaleString('es-ES')}€</p>
      </div>
      <p style="font-size:14px;color:#5C5C5C">El vendedor se pondrá en contacto contigo en breve para coordinar la entrega.</p>
      <p style="font-size:14px;color:#5C5C5C;margin-top:24px">Gracias por usar ReStock.</p>
    </div>
    `
  )

  if (sellerEmail) {
    await sendEmail(
      resendKey,
      sellerEmail,
      'Has vendido un lote en ReStock',
      `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1A1A1A">
        <h2 style="font-size:20px;margin-bottom:8px">¡Tienes una venta!</h2>
        <p style="color:#5C5C5C;margin-bottom:24px">Tu lote ha sido comprado en ReStock.</p>
        <div style="background:#FDFBF7;border:1px solid #E8E4DC;border-radius:8px;padding:20px;margin-bottom:24px">
          <p style="font-size:14px;color:#5C5C5C;margin:0 0 4px">Lote vendido</p>
          <p style="font-size:16px;font-weight:600;margin:0 0 12px">${product.title}</p>
          <p style="font-size:14px;color:#5C5C5C;margin:0 0 4px">Precio de venta</p>
          <p style="font-size:16px;margin:0 0 8px">${product.price.toLocaleString('es-ES')}€</p>
          <p style="font-size:14px;color:#5C5C5C;margin:0 0 4px">Comisión ReStock (${commissionRate}%)</p>
          <p style="font-size:14px;margin:0 0 8px">-${(product.price - sellerReceives).toLocaleString('es-ES')}€</p>
          <p style="font-size:14px;color:#5C5C5C;margin:0 0 4px">Recibirás</p>
          <p style="font-size:20px;font-weight:700;color:#1A3C6E;margin:0">${sellerReceives.toLocaleString('es-ES')}€</p>
        </div>
        <p style="font-size:14px;color:#5C5C5C">Comprador: <strong>${order.buyer_email}</strong></p>
        <p style="font-size:14px;color:#5C5C5C">Contacta con él para coordinar la entrega y recibir el pago en los próximos días hábiles.</p>
      </div>
      `
    )
  }

  return new Response('OK', { status: 200 })
})
