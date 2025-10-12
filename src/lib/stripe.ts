import Stripe from 'stripe'

// Only initialize Stripe if the secret key is available
export const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
}) : null

export const getStripePrices = async () => {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  
  const prices = await stripe.prices.list({
    active: true,
    expand: ['data.product'],
  })
  
  return prices.data
}

export const createStripeCheckoutSession = async (
  userId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) => {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  
  const session = await stripe.checkout.sessions.create({
    customer_email: undefined, // Will be set from user email
    billing_address_collection: 'required',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
  })

  return session
}

export const createStripeCustomerPortalSession = async (
  customerId: string,
  returnUrl: string
) => {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

export const handleStripeWebhook = async (
  event: Stripe.Event
): Promise<{ success: boolean; message?: string }> => {
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        
        if (!userId) {
          return { success: false, message: 'No user ID in session metadata' }
        }

        // Create or update subscription
        await handleSuccessfulPayment(session, userId)
        break
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleSuccessfulInvoicePayment(invoice)
        break
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleFailedInvoicePayment(invoice)
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCancellation(subscription)
        break
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Webhook handling error:', error)
    return { success: false, message: 'Webhook handling failed' }
  }
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session, userId: string) {
  // This would update the user's subscription in the database
  // Implementation depends on your database structure
  console.log('Payment successful for user:', userId)
}

async function handleSuccessfulInvoicePayment(invoice: Stripe.Invoice) {
  // Handle successful recurring payment
  console.log('Invoice payment succeeded:', invoice.id)
}

async function handleFailedInvoicePayment(invoice: Stripe.Invoice) {
  // Handle failed recurring payment
  console.log('Invoice payment failed:', invoice.id)
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  // Handle subscription cancellation
  console.log('Subscription cancelled:', subscription.id)
}