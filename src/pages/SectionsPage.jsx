import { useState } from 'react'
import PageIntro from '../components/PageIntro'

const fallbackImage = '/default.png'

function SectionsPage({ sections, isLoading, onSelect, t }) {
  const [selectedSectionId, setSelectedSectionId] = useState('')

  const handleSelect = (section) => {
    setSelectedSectionId(section.id)
    onSelect(section)
  }

  return (
    <>
      <PageIntro eyebrow={t('steps.sections')} title={t('sections.title')} copy={t('sections.copy')} />

      {isLoading ? (
        <div className="choice-grid two-column">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="choice-card skeleton" key={index} />
          ))}
        </div>
      ) : sections.length ? (
        <>
          <label className="section-select">
            {t('sections.select')}
            <select
              value={selectedSectionId}
              onChange={(event) => {
                const section = sections.find((item) => item.id === event.target.value)
                if (section) handleSelect(section)
              }}
            >
              <option value="">{t('sections.title')}</option>
              {sections.map((section) => (
                <option value={section.id} key={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </label>
          <div className="choice-grid two-column">
            {sections.map((section) => (
              <button className="choice-card compact-choice" type="button" key={section.id} onClick={() => handleSelect(section)}>
                <img
                  src={section.image_url || fallbackImage}
                  alt={section.name}
                  onError={(event) => {
                    event.currentTarget.src = fallbackImage
                  }}
                />
                <strong>{section.name}</strong>
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="notice">{t('sections.empty')}</p>
      )}
    </>
  )
}

export default SectionsPage
