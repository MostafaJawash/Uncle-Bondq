import { getProductImages, money } from '../utils/store'

function ProductCard({ product, isFavorite = false, onOpen, onAddToCart, onToggleFavorite, t }) {
  const image = getProductImages(product)[0]

  return (
    <article className="product-card">
      <button className="product-hit-area" type="button" onClick={() => onOpen(product)}>
        <div className="product-image-frame">
          <img src={image} alt={product.name} loading="lazy" decoding="async" />
        </div>
        <div className="product-card-body">
          <div className="product-card-title-row">
            <h3>{product.name}</h3>
            <strong>{money(product.price)}</strong>
          </div>
          <p>{product.description || t('products.descriptionFallback')}</p>
          {product.weight && <span className="product-weight">{product.weight}</span>}
        </div>
      </button>
      <div className="product-actions">
        <button className="primary-button compact" type="button" onClick={() => onAddToCart(product, 1)}>
          <span aria-hidden="true">＋</span>
          {t('products.addToCart')}
        </button>
        <button
          className={isFavorite ? 'favorite-button is-active' : 'favorite-button'}
          type="button"
          onClick={() => onToggleFavorite(product)}
          aria-label={t('favorites.toggle')}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>
    </article>
  )
}

export default ProductCard
