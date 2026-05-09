import { money } from '../utils/store'

function CartItem({ item, onDecrease, onIncrease, onRemove, t }) {
  return (
    <article className="cart-item">
      {item.image ? <img src={item.image} alt="" loading="lazy" decoding="async" /> : <div className="cart-image-empty" />}
      <div className="cart-item-body">
        <div>
          <h3>{item.name}</h3>
          <p>{money(item.price)}</p>
          {item.weight && <small>{item.weight}</small>}
        </div>
        <div className="quantity-row">
          <button type="button" onClick={() => onDecrease(item.id)} aria-label={t('cart.decrease')}>
            -
          </button>
          <span>{item.quantity}</span>
          <button type="button" onClick={() => onIncrease(item.id)} aria-label={t('cart.increase')}>
            +
          </button>
          <button type="button" className="remove-button" onClick={() => onRemove(item.id)}>
            {t('cart.remove')}
          </button>
        </div>
      </div>
    </article>
  )
}

export default CartItem
