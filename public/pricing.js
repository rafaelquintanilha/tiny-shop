window.Pricing = (() => {
  const SHIPPING_FEE = 5;
  const FREE_SHIPPING_MIN = 50;
  const COUPONS = { SAVE10: 0.1 };

  const round2 = (n) => Math.round(n * 100) / 100;

  // A product is on sale when its original price (compareAtPrice) is above its price.
  // The storefront's "Sale" tag and coupon eligibility both use this one check.
  const isOnSale = (p) => Number(p.compareAtPrice) > p.price;

  function quote(items, catalog, coupon = '') {
    const lines = [];
    for (const { id, qty } of items) {
      const product = catalog.find((p) => p.id === id);
      const n = Math.max(0, Math.floor(Number(qty) || 0));
      if (!product || n === 0) continue;
      lines.push({ id, name: product.name, price: product.price, qty: n, lineTotal: round2(product.price * n), product });
    }

    const subtotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));

    let discount = 0;
    let couponStatus = null;
    const code = typeof coupon === 'string' ? coupon.trim().toUpperCase() : '';
    if (code) {
      const rate = Object.prototype.hasOwnProperty.call(COUPONS, code) ? COUPONS[code] : 0;
      if (!rate) {
        couponStatus = 'invalid';
      } else {
        couponStatus = 'applied';
        for (const line of lines) {
          if (isOnSale(line.product)) continue;
          discount += line.lineTotal * rate;
        }
      }
    }
    discount = round2(discount);

    // Free shipping is decided on the subtotal before any coupon, so applying a
    // coupon never takes free shipping away.
    const freeShipping = lines.length === 0 || subtotal >= FREE_SHIPPING_MIN;
    const shipping = freeShipping ? 0 : SHIPPING_FEE;
    // How much more the customer must add to the cart to ship free (0 once they qualify).
    const freeShippingGap = freeShipping ? 0 : round2(FREE_SHIPPING_MIN - subtotal);
    const total = round2(subtotal - discount + shipping);

    return {
      lines: lines.map(({ product, ...l }) => l),
      subtotal,
      coupon: couponStatus === 'applied' ? code : null,
      couponStatus,
      discount,
      shipping,
      freeShippingGap,
      total,
    };
  }

  return { quote, isOnSale, COUPONS, SHIPPING_FEE, FREE_SHIPPING_MIN };
})();
