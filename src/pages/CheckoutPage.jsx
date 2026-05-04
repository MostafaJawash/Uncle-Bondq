import OrderSummaryTable from '../components/OrderSummaryTable'
import PageIntro from '../components/PageIntro'

function CheckoutPage({
  checkout,
  setCheckout,
  cart,
  cartTotal,
  couponCode,
  couponDiscount,
  onCouponChange,
  isSubmitting,
  onSubmit,
  t,
}) {
  return (
    <>
      <PageIntro
        eyebrow={t('steps.checkout')}
        title={t('checkout.title')}
        copy={t('checkout.copy')}
      />

      <section className="checkout-grid">
        <form className="checkout-form panel" onSubmit={onSubmit}>
          <label>
            {t('checkout.phone')}
            <input
              required
              type="tel"
              value={checkout.phone}
              onChange={(event) => setCheckout((value) => ({ ...value, phone: event.target.value }))}
              placeholder={t('checkout.phonePlaceholder')}
            />
          </label>
          <label>
            {t('checkout.address')}
            <textarea
              required
              value={checkout.address}
              onChange={(event) => setCheckout((value) => ({ ...value, address: event.target.value }))}
              placeholder={t('checkout.addressPlaceholder')}
            />
          </label>
          <label>
            {t('checkout.notes')}
            <textarea
              value={checkout.notes}
              onChange={(event) => setCheckout((value) => ({ ...value, notes: event.target.value }))}
              placeholder={t('checkout.notesPlaceholder')}
            />
          </label>
          <button className="primary-button" type="submit" disabled={!cart.length || isSubmitting}>
            {isSubmitting ? t('checkout.submitting') : t('checkout.submit')}
          </button>
        </form>

        <aside className="summary-card">
          <h2>{t('checkout.summary')}</h2>
          <label className="coupon-field">
            {t('coupon.label')}
            <input
              value={couponCode}
              onChange={(event) => onCouponChange(event.target.value)}
              placeholder={t('coupon.placeholder')}
            />
          </label>
          {couponDiscount > 0 && (
            <div className="total-row">
              <span>{t('coupon.discount')}</span>
              <strong>-{couponDiscount.toLocaleString('ar-SY')} ل.س</strong>
            </div>
          )}
          <OrderSummaryTable items={cart} total={cartTotal} t={t} />
        </aside>
      </section>
    </>
  )
}

export default CheckoutPage
