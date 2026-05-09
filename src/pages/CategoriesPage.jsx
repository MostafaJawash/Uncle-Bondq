import { useMemo, useState } from 'react'
import PageIntro from '../components/PageIntro'

const fallbackImage = '/default.png'

function CategoriesPage({ categories, isLoading, onSelect, t }) {
  const [search, setSearch] = useState('')
  const visibleCategories = useMemo(
    () => categories.filter((category) => category.name.toLowerCase().includes(search.trim().toLowerCase())),
    [categories, search],
  )

  return (
    <>
      <PageIntro eyebrow={t('steps.categories')} title={t('categories.title')} copy={t('categories.copy')} />

      <label className="search-field">
        {t('search.label')}
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('search.placeholder')} />
      </label>

      {isLoading ? (
        <div className="choice-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="choice-card skeleton" key={index} />
          ))}
        </div>
      ) : visibleCategories.length ? (
        <div className="choice-grid">
          {visibleCategories.map((category) => (
            <button className="choice-card" type="button" key={category.id} onClick={() => onSelect(category)}>
              <img
                src={category.image_url || fallbackImage}
                alt={category.name}
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.src = fallbackImage
                }}
              />
              <strong>{category.name}</strong>
            </button>
          ))}
        </div>
      ) : (
        <p className="notice">{t('categories.empty')}</p>
      )}
    </>
  )
}

export default CategoriesPage
