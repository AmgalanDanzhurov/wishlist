import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, type ReactNode } from 'react'
import { positionBetween } from '../lib/calc'
import type { Item } from '../types'
import { GripIcon } from './icons'

interface Props {
  items: Item[]
  renderCard: (item: Item, dragHandle?: ReactNode) => ReactNode
  onMove: (id: string, position: number) => void
}

function SortableCard({ item, renderCard }: { item: Item; renderCard: Props['renderCard'] }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  // тянуть можно только за ручку — иначе на телефоне не получится прокручивать список
  const handle = (
    <button
      ref={setActivatorNodeRef}
      className="card__grip"
      aria-label={`Перетащить «${item.title}»`}
      title="Перетащить"
      {...attributes}
      {...listeners}
    >
      <GripIcon />
    </button>
  )

  return (
    <div
      ref={setNodeRef}
      className={`sortable ${isDragging ? 'sortable--placeholder' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      {renderCard(item, handle)}
    </div>
  )
}

/** Сетка карточек с перетаскиванием (мышь, палец, клавиатура: Пробел — взять, стрелки — двигать). */
export function SortableGrid({ items, renderCard, onMove }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const active = items.find((i) => i.id === activeId)

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = items.findIndex((i) => i.id === active.id)
    const to = items.findIndex((i) => i.id === over.id)
    const reordered = arrayMove(items, from, to)
    onMove(String(active.id), positionBetween(reordered[to - 1], reordered[to + 1]))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <div className="grid">
          {items.map((item) => (
            <SortableCard key={item.id} item={item} renderCard={renderCard} />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>{active ? <div className="sortable sortable--overlay">{renderCard(active)}</div> : null}</DragOverlay>
    </DndContext>
  )
}
