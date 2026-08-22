// Mirrors backend src/constants/orderStatus.js — kept in sync by hand since
// the frontend and backend are separate deployables. If you change the enum
// values on the backend, update these labels/colors too.

export const ORDER_STATUS_LABELS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  PACKED: 'Packed',
  DISPATCHED: 'Dispatched',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
  REFUNDED: 'Refunded',
};

export const ORDER_STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-sky-100 text-sky-800',
  PROCESSING: 'bg-sky-100 text-sky-800',
  PACKED: 'bg-indigo-100 text-indigo-800',
  DISPATCHED: 'bg-indigo-100 text-indigo-800',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
  RETURNED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-slate-200 text-slate-700',
};

export const PRESCRIPTION_STATUS_LABELS = {
  UPLOADED: 'Uploaded',
  UNDER_REVIEW: 'Under review',
  VERIFIED: 'Verified',
  NEEDS_CLARIFICATION: 'Needs clarification',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  FULFILLED: 'Fulfilled',
};

export const PRESCRIPTION_STATUS_COLORS = {
  UPLOADED: 'bg-slate-200 text-slate-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800',
  VERIFIED: 'bg-sky-100 text-sky-800',
  NEEDS_CLARIFICATION: 'bg-orange-100 text-orange-800',
  ACCEPTED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  FULFILLED: 'bg-emerald-100 text-emerald-800',
};

// Mirrors backend ORDER_STATUS_TRANSITIONS / PRESCRIPTION_STATUS_TRANSITIONS
// — used only to populate the admin "change status to…" dropdown with valid
// next steps. The backend re-validates every transition independently.
export const ORDER_STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['OUT_FOR_DELIVERY', 'RETURNED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  RETURNED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export const PRESCRIPTION_STATUS_TRANSITIONS = {
  UPLOADED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['VERIFIED', 'NEEDS_CLARIFICATION', 'REJECTED'],
  NEEDS_CLARIFICATION: ['UNDER_REVIEW', 'REJECTED'],
  VERIFIED: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['FULFILLED'],
  REJECTED: [],
  FULFILLED: [],
};

// Online gateways (bKash/Nagad/Rocket/SSLCommerz) need a trade license for a
// live merchant account, so only COD is offered until one is in place. Add
// the other entries back once a gateway is actually live.
export const PAYMENT_METHODS = [
  { value: 'COD', label: 'Cash on Delivery' },
];

export const DISTRICTS = [
  'Dhaka',
  'Chattogram',
  'Khulna',
  'Rajshahi',
  'Sylhet',
  'Barishal',
  'Rangpur',
  'Mymensingh',
];
