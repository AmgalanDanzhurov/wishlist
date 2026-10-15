import type { CSSProperties } from 'react'
import type { Category, SortKey } from '../types'
import { PlusIcon, TagsIcon } from './icons'

interface Props {
  categories: Category[]
  /** выбранные категории; пустой список — все */
  categoryIds: string[]
  onCategoryIdsChange: (ids: string[]) => void
  sort: SortKey
  onSortChange: (s: SortKey) => void
  onlyAffordable: boolean
  onOnlyAffordableChange: (v: boolean) => void
  onManageCategories: () => void
  onAdd: () => void
  showAffordable: boolean
}

const SORT_LABEL: Record<SortKey, string> = {
  manual: 'Свой порядок',
  priority: 'По приоритету',
  'price-asc': 'Сначала дешёвые',
  'price-desc': 'Сначала дорогие',
  'target-date': 'По дате цели',
  newest: 'Сначала новые',
}

export function Toolbar(props: Props) {
  const {
    categories,
    categoryIds,
    onCategoryIdsChange,
    sort,
    onSortChange,
    onlyAffordable,
    onOnlyAffordableChange,
    onManageCategories,
    onAdd,
    showAffordable,
  } = props

  return (
    <div className="toolbar">
      {/* можно выбрать несколько категорий; «Все» сбрасывает выбор */}
      <div className="chips" role="group" aria-label="Категории">
        <button aria-pressed={categoryIds.length === 0} className="chip" onClick={() => onCategoryIdsChange([])}>
          Все
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            aria-pressed={categoryIds.includes(c.id)}
            className="chip"
            style={{ '--chip': c.color } as CSSProperties}
            onClick={() =>
              onCategoryIdsChange(
                categoryIds.includes(c.id) ? categoryIds.filter((id) => id !== c.id) : [...categoryIds, c.id],
              )
            }
          >
            <span className="chip__dot" />
            {c.name}
          </button>
        ))}
        <button className="chip chip--ghost" onClick={onManageCategories} title="Настроить категории">
          <TagsIcon />
          {categories.length === 0 ? 'Добавить категорию' : 'Изменить'}
        </button>
      </div>

      <div className="toolbar__right">
        {/* в архиве купленного фильтр «могу купить» и сортировка не нужны */}
        {showAffordable && (
          <>
            <label className="switch">
              <input type="checkbox" checked={onlyAffordable} onChange={(e) => onOnlyAffordableChange(e.target.checked)} />
              <span className="switch__track" />
              Могу купить
            </label>
            <select className="select" value={sort} onChange={(e) => onSortChange(e.target.value as SortKey)} aria-label="Сортировка">
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABEL[k]}
                </option>
              ))}
            </select>
          </>
        )}
        <button className="btn add-btn" onClick={onAdd} aria-label="Добавить желание">
          <PlusIcon />
          <span>Добавить</span>
        </button>
      </div>
    </div>
  )
}
