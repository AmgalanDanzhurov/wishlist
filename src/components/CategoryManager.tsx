import { useState, type CSSProperties, type FormEvent } from 'react'
import type { CategoryInput } from '../hooks/useWishData'
import { CATEGORY_COLORS } from '../lib/colors'
import type { Category, Item } from '../types'
import { TrashIcon } from './icons'
import { Modal } from './Modal'

interface Props {
  categories: Category[]
  items: Item[]
  onSave: (input: CategoryInput, id?: string) => Promise<Category>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="colors" role="radiogroup" aria-label="Цвет">
      {CATEGORY_COLORS.map((c) => (
        <button
          type="button"
          key={c}
          role="radio"
          aria-checked={c === value}
          aria-label={c}
          className="colors__swatch"
          style={{ '--chip': c } as CSSProperties}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  )
}

function CategoryRow({
  category,
  count,
  onSave,
  onDelete,
}: {
  category: Category
  count: number
  onSave: Props['onSave']
  onDelete: Props['onDelete']
}) {
  const [name, setName] = useState(category.name)
  const [error, setError] = useState<string | null>(null)

  async function save(patch: Partial<CategoryInput>) {
    const next = { name: category.name, color: category.color, ...patch }
    if (!next.name.trim()) return setName(category.name)
    if (next.name === category.name && next.color === category.color) return
    try {
      await onSave({ name: next.name.trim(), color: next.color }, category.id)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить')
    }
  }

  async function remove() {
    const question =
      count > 0
        ? `Удалить категорию «${category.name}»? ${count} товар(ов) останутся, но без категории.`
        : `Удалить категорию «${category.name}»?`
    if (!confirm(question)) return
    try {
      await onDelete(category.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить')
    }
  }

  return (
    <li className="cat-row">
      <div className="cat-row__main">
        <span className="chip__dot" style={{ '--chip': category.color } as CSSProperties} />
        <input
          className="input input--inline"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => save({ name })}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          aria-label="Название категории"
        />
        <span className="muted cat-row__count">{count}</span>
        <button className="icon-btn icon-btn--flat" onClick={remove} aria-label={`Удалить ${category.name}`}>
          <TrashIcon />
        </button>
      </div>
      <ColorPicker value={category.color} onChange={(color) => save({ color })} />
      {error && <p className="form__error">{error}</p>}
    </li>
  )
}

export function CategoryManager({ categories, items, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length])
  const [error, setError] = useState<string | null>(null)

  async function add(e: FormEvent) {
    e.preventDefault()
    try {
      await onSave({ name: name.trim(), color })
      setName('')
      setColor(CATEGORY_COLORS[(categories.length + 1) % CATEGORY_COLORS.length])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить')
    }
  }

  return (
    <Modal title="Категории" onClose={onClose}>
      {categories.length > 0 ? (
        <ul className="cat-list">
          {categories.map((c) => (
            <CategoryRow
              key={c.id}
              category={c}
              count={items.filter((i) => i.category_ids.includes(c.id)).length}
              onSave={onSave}
              onDelete={onDelete}
            />
          ))}
        </ul>
      ) : (
        <p className="muted">Категорий пока нет.</p>
      )}

      <form className="form cat-add" onSubmit={add}>
        <div className="field">
          <span>Новая категория</span>
          <div className="cat-add__row">
            <input
              className="input"
              required
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Книги"
            />
            <button className="btn">Добавить</button>
          </div>
        </div>
        <ColorPicker value={color} onChange={setColor} />
        {error && <p className="form__error">{error}</p>}
      </form>
    </Modal>
  )
}
