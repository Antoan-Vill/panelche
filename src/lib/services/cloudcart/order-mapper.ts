import type { CloudCartOrder, CloudCartOrderItem } from '@/schemas/cloudcart-order';
import type { OrderDoc, OrderItem } from '@/lib/types/orders';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Determine owner type and ID from CloudCart order
 */
export function determineOwnerFromCloudCartOrder(order: CloudCartOrder) {
  if (order.attributes.customer_email) {
    return {
      kind: 'customer' as const,
      // Use customer ID if available, otherwise fallback to guest email format
      customerId: order.attributes.customer_id?.toString() || `guest:${order.attributes.customer_email}`,
      email: order.attributes.customer_email,
      name: [order.attributes.customer_first_name, order.attributes.customer_last_name]
        .filter(Boolean)
        .join(' ') || undefined,
    };
  }

  // Fallback for orders without email (should be rare/impossible in CloudCart)
  return {
    kind: 'guest' as const,
    email: 'unknown@example.com',
    name: [order.attributes.customer_first_name, order.attributes.customer_last_name]
      .filter(Boolean)
      .join(' ') || undefined,
  };
}

/**
 * Map CloudCart order item to local OrderItem format
 */
export function mapCloudCartItemToOrderItem(item: CloudCartOrderItem): OrderItem {
  // Try to find quantity/price/total in attributes
  // Note: 'products' type in included usually has the transactional data in CloudCart order context
  const quantity = item.attributes.quantity || 1;
  const unitPrice = item.attributes.price || 0;
  const totalPrice = item.attributes.total || (quantity * unitPrice);
  
  // Handle case where IDs might be numbers or strings
  const productId = item.attributes.product_id?.toString() || item.id;
  const variantId = item.attributes.variant_id?.toString() || null;

  return {
    productId: productId,
    productName: item.attributes.name || 'Unknown Product',
    sku: item.attributes.sku || null,
    variantId: variantId,
    quantity,
    unitPrice,
    unitPriceCents: Math.round(unitPrice * 100),
    totalPrice,
    totalPriceCents: Math.round(totalPrice * 100),
    imageUrl: item.attributes.image_url || null,
    note: '',
  };
}

/**
 * Map CloudCart order to local OrderDoc format
 */
export function mapCloudCartOrderToLocalOrder(
  order: CloudCartOrder, 
  items: CloudCartOrderItem[]
): Omit<OrderDoc, 'createdAt'> & { createdAt: unknown } {
  const owner = determineOwnerFromCloudCartOrder(order);
  const mappedItems = items.map(mapCloudCartItemToOrderItem);
  
  // Use CloudCart totals if available (new or old fields)
  // price_total is the new field, total is the old one
  const total = order.attributes.price_total ?? order.attributes.total ?? 0;
  // subtotal might be same as total if taxes/shipping not separated or calculated
  const subtotal = order.attributes.subtotal ?? total;
  
  const ownerId = owner.kind === 'customer' 
    ? owner.customerId 
    : `guest:${owner.email.toLowerCase()}`;
    
  // Map CloudCart status to local status
  let status = order.attributes.status;
  // Basic mapping - can be expanded
  if (status === 'new' || status === 'unfulfilled') status = 'pending';
  else if (status === 'fulfilled' || status === 'completed') status = 'completed';
  else if (status === 'cancelled') status = 'cancelled';
  
  return {
    userId: ownerId,
    externalOrderId: order.id,
    status,
    items: mappedItems,
    subtotal,
    total,
    subtotalCents: Math.round(subtotal * 100),
    totalCents: Math.round(total * 100),
    createdAt: FieldValue.serverTimestamp(), // Will be replaced by actual timestamp on write
    source: 'cloudcart',
    cloudCartData: order,
  };
}
