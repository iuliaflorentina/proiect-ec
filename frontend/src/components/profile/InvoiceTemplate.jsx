import React from 'react'
import { Palette } from 'lucide-react'

export const InvoiceTemplate = React.forwardRef(({ order }, ref) => {
  if (!order) return null

  const formatDate = (date) => {
    const d = date?.toDate ? date.toDate() : new Date(date)
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString()
  }

  return (
    <div ref={ref} className="bg-white p-12 text-zinc-900 font-sans min-h-[297mm] w-[210mm] border border-zinc-100 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <Palette className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight italic font-serif">Juliette Deliveries 🎨</h1>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Premium Custom Wearables</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-light uppercase tracking-[0.2em] text-zinc-300 mb-1">Invoice</h2>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">#{order.id.slice(-8).toUpperCase()}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-12 mb-16">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 border-b border-zinc-100 pb-1">Billed To</h3>
          <p className="text-sm font-bold">{order.shipping?.firstName} {order.shipping?.lastName}</p>
          <p className="text-xs text-zinc-500 mt-1">{order.shipping?.address}</p>
          <p className="text-xs text-zinc-500">{order.shipping?.city}, {order.shipping?.state} {order.shipping?.zip}</p>
          <p className="text-xs text-zinc-500 mt-2">{order.userEmail}</p>
        </div>
        <div className="text-right">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 border-b border-zinc-100 pb-1 text-right">Order Details</h3>
          <p className="text-xs"><span className="text-zinc-400 font-bold uppercase tracking-tighter mr-2">Date:</span> {formatDate(order.createdAt)}</p>
          <p className="text-xs mt-1"><span className="text-zinc-400 font-bold uppercase tracking-tighter mr-2">Method:</span> Stripe / {order.paymentMethod?.toUpperCase()}</p>
          <p className="text-xs mt-1"><span className="text-zinc-400 font-bold uppercase tracking-tighter mr-2">Status:</span> {order.status?.toUpperCase()}</p>
        </div>
      </div>

      {/* Table */}
      <div className="flex-grow">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-900 text-[10px] font-black uppercase tracking-widest text-zinc-400">
              <th className="py-4 font-black">Description</th>
              <th className="py-4 text-center font-black">Quantity</th>
              <th className="py-4 text-right font-black">Unit Price</th>
              <th className="py-4 text-right font-black">Amount</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {order.items?.map((item, idx) => (
              <tr key={idx} className="border-b border-zinc-50">
                <td className="py-6">
                  <p className="font-bold uppercase tracking-tight">{item.name}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{item.color ? `Color: ${item.color}` : 'Custom Hand-Painted Site Exclusive'}</p>
                </td>
                <td className="py-6 text-center">{item.quantity}</td>
                <td className="py-6 text-right">${parseFloat(item.price).toFixed(2)}</td>
                <td className="py-6 text-right font-bold">${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mt-12 flex justify-end">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-400">
            <span>Subtotal</span>
            <span className="text-zinc-900">${parseFloat(order.subtotal || 0).toFixed(2)}</span>
          </div>
          {parseFloat(order.discount || 0) > 0 && (
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-green-600 italic">
              <span>Discount</span>
              <span>-${parseFloat(order.discount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-400">
            <span>Shipping</span>
            <span className="text-zinc-900">{parseFloat(order.shippingCost || 0) === 0 ? 'FREE' : `$${parseFloat(order.shippingCost).toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between border-t border-zinc-900 pt-4 text-lg font-black uppercase tracking-tight">
            <span>Total</span>
            <span className="text-primary">${parseFloat(order.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-24 border-t border-zinc-100 pt-8 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 mb-2">Thank you for choosing Juliette Deliveries</p>
        <p className="text-[8px] text-zinc-400 leading-relaxed italic">
          This is a computer-generated document. No signature required. 
          For support or returns, please contact our support team at gallery@juliettedeliveries.art
        </p>
      </div>
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  )
})
