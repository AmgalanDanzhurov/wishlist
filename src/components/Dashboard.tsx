import { lazy, Suspense, useState, type ReactNode } from 'react'
import type { ThemeMode } from '../hooks/useTheme'
import { useRates } from '../hooks/useRates'
import { useWishData } from '../hooks/useWishData'
import { priceIn, sortItems, totalSavings } from '../lib/calc'
import type { Item, SortKey } from '../types'
import { AccountDialog } from './AccountDialog'
import { BuyDialog } from './BuyDialog'
import { CategoryManager } from './CategoryManager'
import { DepositForm } from './DepositForm'
import { Header } from './Header'
import { ItemCard } from './ItemCard'
import { ItemForm } from './ItemForm'
import { SavingsBanner } from './SavingsBanner'
import { SortableGrid } from './SortableGrid'
import { Toolbar } from './Toolbar'

const SORT_KEY = 'mywish:sort'
const SORT_KEYS: SortKey[] = ['manual', 'priority', 'price-asc', 'price-desc', 'target-date', 'newest']

/** Выбранная сортировка запоминается на устройстве; по умолчанию — свой порядок. */
function useStoredSort() {
  const [sort, setSort] = useState<SortKey>(() => {
    try {
      const saved = localStorage.getItem(SORT_KEY) as SortKey | null
      if (saved && SORT_KEYS.includes(saved)) return saved
    } catch {
      // хранилище недоступно
    }
    return 'manual'
  })
  const update = (s: SortKey) => {
    setSort(s)
    try {
      localStorage.setItem(SORT_KEY, s)
    } catch {
      // ignore
    }
  }
  return [sort, update] as const
}

// график тянет recharts — грузим его только когда открыли историю
const DepositHistory = lazy(() => import('./DepositHistory').then((m) => ({ default: m.DepositHistory })))

interface Props {
  userId: string
  email: string | undefined
  themeMode: ThemeMode
  onThemeCycle: () => void
}

export function Dashboard({ userId, email, themeMode, onThemeCycle }: Props) {
  const [showingAccount, setShowingAccount] = useState(false)
  const rates = useRates()
  const {
    data,
    error,
    setMainCurrency,
    seedDemo,
    saveItem,
    deleteItem,
    saveCategory,
    deleteCategory,
    addDeposit,
    deleteDeposit,
    markBought,
    moveItem,
    restoreItem,
  } = useWishData(userId)
  const [view, setView] = useState<'wanted' | 'bought'>('wanted')
  const [buying, setBuying] = useState<Item | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [depositing, setDepositing] = useState(false)
  const [showingHistory, setShowingHistory] = useState(false)
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [sort, setSort] = useStoredSort()
  const [onlyAffordable, setOnlyAffordable] = useState(false)
  const [seeding, setSeeding] = useState(false)
  // null — форма закрыта, 'new' — новое желание, Item — редактирование
  const [editing, setEditing] = useState<Item | 'new' | null>(null)
  const [managingCategories, setManagingCategories] = useState(false)

  const header = (
    <Header
      mainCurrency={data?.mainCurrency ?? 'RUB'}
      onCurrencyChange={setMainCurrency}
      themeMode={themeMode}
      onThemeCycle={onThemeCycle}
      onAccount={() => setShowingAccount(true)}
    />
  )

  if (!data) {
    return (
      <div className="app">
        {header}
        <p className="empty">{error ? `Не удалось загрузить данные: ${error}` : 'Загружаем…'}</p>
      </div>
    )
  }

  const { categories, items, deposits, mainCurrency } = data
  const savings = totalSavings(deposits, mainCurrency, rates.rates)
  const wanted = items.filter((i) => i.status === 'wanted')
  // выбранные категории (удалённые из выбора отбрасываем); пустой список — все желания
  const selectedCategories = categories.filter((c) => categoryIds.includes(c.id))
  const inSelectedCategories = (i: Item) =>
    selectedCategories.length === 0 || selectedCategories.some((c) => i.category_ids.includes(c.id))

  // плашка считает только желания выбранных категорий
  const wantedInScope = wanted.filter(inSelectedCategories)
  const wishedTotal = wantedInScope.reduce((sum, i) => sum + priceIn(i, mainCurrency, rates.rates), 0)
  const affordableCount = wantedInScope.filter((i) => priceIn(i, mainCurrency, rates.rates) <= savings).length

  const bought = items.filter((i) => i.status === 'bought')

  const filtered = (view === 'wanted' ? wanted : bought).filter(
    (i) =>
      inSelectedCategories(i) &&
      (view === 'bought' || !onlyAffordable || priceIn(i, mainCurrency, rates.rates) <= savings),
  )
  const visible =
    view === 'wanted'
      ? sortItems(filtered, sort, mainCurrency, rates.rates)
      : [...filtered].sort((a, b) => (b.bought_at ?? '').localeCompare(a.bought_at ?? ''))
  const draggable = view === 'wanted' && sort === 'manual'

  const renderCard = (item: Item, dragHandle?: ReactNode) => (
    <ItemCard
      key={item.id}
      item={item}
      categories={categories.filter((c) => item.category_ids.includes(c.id))}
      savings={savings}
      mainCurrency={mainCurrency}
      rates={rates.rates}
      onEdit={() => setEditing(item)}
      onBuy={() => setBuying(item)}
      onRestore={() => handleRestore(item)}
      dragHandle={dragHandle}
    />
  )

  async function handleRestore(item: Item) {
    const deducted = deposits.some((d) => d.item_id === item.id && d.amount < 0)
    const question = deducted
      ? `Вернуть «${item.title}» в список желаний? Списание за покупку будет отменено.`
      : `Вернуть «${item.title}» в список желаний?`
    if (!confirm(question)) return
    try {
      await restoreItem(item)
      setActionError(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось вернуть товар')
    }
  }

  async function handleSeed() {
    setSeeding(true)
    await seedDemo()
    setSeeding(false)
  }

  return (
    <div className="app">
      {header}

      <main className="main">
        {(error || actionError) && <p className="alert">{error ?? actionError}</p>}

        <SavingsBanner
          savings={savings}
          wishedTotal={wishedTotal}
          affordableCount={affordableCount}
          wantedCount={wantedInScope.length}
          categoryNames={selectedCategories.map((c) => c.name)}
          currency={mainCurrency}
          rates={rates}
          onDeposit={() => setDepositing(true)}
          onHistory={() => setShowingHistory(true)}
        />

        {items.length === 0 ? (
          <div className="empty">
            <p>Список желаний пока пуст.</p>
            <p className="muted">Добавь первое желание или посмотри, как всё выглядит, на примерах.</p>
            <div className="empty__actions">
              <button className="btn" onClick={() => setEditing('new')}>
                Добавить желание
              </button>
              <button className="btn btn--ghost" onClick={handleSeed} disabled={seeding}>
                {seeding ? 'Добавляем…' : 'Заполнить примерами'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="view-tabs" role="tablist" aria-label="Раздел">
              <button role="tab" aria-selected={view === 'wanted'} onClick={() => setView('wanted')}>
                Хочу <span className="view-tabs__count">{wanted.length}</span>
              </button>
              <button role="tab" aria-selected={view === 'bought'} onClick={() => setView('bought')}>
                Куплено <span className="view-tabs__count">{bought.length}</span>
              </button>
            </div>

            <Toolbar
              showAffordable={view === 'wanted'}
              categories={categories}
              categoryIds={categoryIds}
              onCategoryIdsChange={setCategoryIds}
              sort={sort}
              onSortChange={setSort}
              onlyAffordable={onlyAffordable}
              onOnlyAffordableChange={setOnlyAffordable}
              onManageCategories={() => setManagingCategories(true)}
              onAdd={() => setEditing('new')}
            />

            {visible.length > 0 ? (
              draggable ? (
                <SortableGrid items={visible} renderCard={renderCard} onMove={moveItem} />
              ) : (
                <div className="grid">{visible.map((item) => renderCard(item))}</div>
              )
            ) : (
              <p className="empty">
                {view === 'bought' && bought.length === 0
                  ? 'Пока ничего не куплено. Нажми «Куплено» на карточке, когда исполнишь желание.'
                  : view === 'wanted' && wanted.length === 0
                    ? 'Все желания исполнены! Добавь новое.'
                    : 'Здесь пока пусто — попробуй сменить фильтр.'}
              </p>
            )}
          </>
        )}
      </main>

      {editing && (
        <ItemForm
          item={editing === 'new' ? null : editing}
          categories={categories}
          onSave={saveItem}
          onDelete={deleteItem}
          onClose={() => setEditing(null)}
        />
      )}

      {managingCategories && (
        <CategoryManager
          categories={categories}
          items={items}
          onSave={saveCategory}
          onDelete={async (id) => {
            await deleteCategory(id)
            setCategoryIds((ids) => ids.filter((x) => x !== id))
          }}
          onClose={() => setManagingCategories(false)}
        />
      )}

      {buying && (
        <BuyDialog item={buying} onConfirm={(spent) => markBought(buying, spent)} onClose={() => setBuying(null)} />
      )}

      {depositing && (
        <DepositForm defaultCurrency={mainCurrency} onSave={addDeposit} onClose={() => setDepositing(false)} />
      )}

      {showingHistory && (
        <Suspense fallback={null}>
          <DepositHistory
            deposits={deposits}
            mainCurrency={mainCurrency}
            rates={rates.rates}
            onDelete={deleteDeposit}
            onClose={() => setShowingHistory(false)}
          />
        </Suspense>
      )}

      {showingAccount && <AccountDialog email={email} onClose={() => setShowingAccount(false)} />}
    </div>
  )
}
