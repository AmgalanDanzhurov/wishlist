import type { CSSProperties } from 'react'
import type { Category, SortKey } from '../types'
import { PlusIcon, TagsIcon } from './icons'

interface Props {
  categories: Category[]
  categoryId: string | null
  onCategoryChange: (id: string | null) => void
  sort: SortKey
  onSortChange: (s: SortKey) => void
  onlyAffordable: boolean
  onOnlyAffordableChange: (v: boolean) => void
  onManageCategories: () => void
  onAdd: () => void
  showAffordable: boolean
}

const SORT_LABEL: Record<SortKey, string> = {
  priority: 'По приоритету',
  'price-asc': 'Сначала дешёвые',
  'price-desc': 'Сначала дорогие',
  'target-date': 'По дате цели',
  newest: 'Сначала новые',
}

export function Toolbar(props: Props) {
  const {
    categories,
    categoryId,
    onCategoryChange,
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
      <div className="chips" role="tablist" aria-label="Категории">
        <button role="tab" aria-selected={categoryId === null} className="chip" onClick={() => onCategoryChange(null)}>
          Все
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={categoryId === c.id}
            className="chip"
            style={{ '--chip': c.color } as CSSProperties}
            onClick={() => onCategoryChange(c.id)}
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
