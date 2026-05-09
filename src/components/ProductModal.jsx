import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getProductImages, money } from '../utils/store'

function ProductModal({ product, quantity, setQuantity, onClose, onAddToCart, t }) {
  const images = getProductImages(product)
  const primaryImage = images[0] || ''
  const [activeImage, setActiveImage] = useState(primaryImage)

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.article
        className="product-modal"
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label={t('products.details')}>
          ×
        </button>
        <div className="modal-media">
          <img src={activeImage} alt={product.name} decoding="async" />
          {images.length > 1 && (
            <div className="thumb-row">
              {images.map((image) => (
                <button
                  className={image === activeImage ? 'is-active' : ''}
                  type="button"
                  key={image}
                  onClick={() => setActiveImage(image)}
                >
                  <img src={image} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="modal-content">
          <p className="eyebrow">{t('products.details')}</p>
          <h2>{product.name}</h2>
          <strong className="modal-price">{money(product.price)}</strong>
          <p>{product.description || t('products.descriptionFallback')}</p>
          {product.weight && (
            <div className="detail-box">
              <span>{t('products.weight')}</span>
              <b>{product.weight}</b>
            </div>
          )}
          <div className="modal-action-row">
            <div className="quantity-control" aria-label="Choose quantity">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                -
              </button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)}>
                +
              </button>
            </div>
            <button className="primary-button" type="button" onClick={() => onAddToCart(product, quantity)}>
              <span aria-hidden="true">＋</span>
              {t('products.addToCart')}
            </button>
          </div>
        </div>
      </motion.article>
    </motion.div>
  )
}

export default ProductModal
