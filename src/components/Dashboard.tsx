import { lazy, Suspense, useState } from 'react'
import type { ThemeMode } from '../hooks/useTheme'
import { useRates } from '../hooks/useRates'
import { useWishData } from '../hooks/useWishData'
import { priceIn, sortItems, totalSavings } from '../lib/calc'
import { supabase } from '../lib/supabase'
import type { Item, SortKey } from '../types'
import { BuyDialog } from './BuyDialog'
import { CategoryManager } from './CategoryManager'
import { DepositForm } from './DepositForm'
import { Header } from './Header'
import { ItemCard } from './ItemCard'
import { ItemForm } from './ItemForm'
import { SavingsBanner } from './SavingsBanner'
import { Toolbar } from './Toolbar'

// график тянет recharts — грузим его только когда открыли историю
const DepositHistory = lazy(() => import('./DepositHistory').then((m) => ({ default: m.DepositHistory })))

interface Props {
  userId: string
  themeMode: ThemeMode
  onThemeCycle: () => void
}

export function Dashboard({ userId, themeMode, onThemeCycle }: Props) {
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
    restoreItem,
  } = useWishData(userId)
  const [view, setView] = useState<'wanted' | 'bought'>('wanted')
  const [buying, setBuying] = useState<Item | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [depositing, setDepositing] = useState(false)
  const [showingHistory, setShowingHistory] = useState(false)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('priority')
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
      onSignOut={() => supabase.auth.signOut()}
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
  const wishedTotal = wanted.reduce((sum, i) => sum + priceIn(i, mainCurrency, rates.rates), 0)
  const affordableCount = wanted.filter((i) => priceIn(i, mainCurrency, rates.rates) <= savings).length

  const bought = items.filter((i) => i.status === 'bought')

  const filtered = (view === 'wanted' ? wanted : bought).filter(
    (i) =>
      (categoryId === null || i.category_id === categoryId) &&
      (view === 'bought' || !onlyAffordable || priceIn(i, mainCurrency, rates.rates) <= savings),
  )
  const visible =
    view === 'wanted'
      ? sortItems(filtered, sort, mainCurrency, rates.rates)
      : [...filtered].sort((a, b) => (b.bought_at ?? '').localeCompare(a.bought_at ?? ''))

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
          wantedCount={wanted.length}
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
              categoryId={categoryId}
              onCategoryChange={setCategoryId}
              sort={sort}
              onSortChange={setSort}
              onlyAffordable={onlyAffordable}
              onOnlyAffordableChange={setOnlyAffordable}
              onManageCategories={() => setManagingCategories(true)}
              onAdd={() => setEditing('new')}
            />

            {visible.length > 0 ? (
              <div className="grid">
                {visible.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    category={categories.find((c) => c.id === item.category_id)}
                    savings={savings}
                    mainCurrency={mainCurrency}
                    rates={rates.rates}
                    onEdit={() => setEditing(item)}
                    onBuy={() => setBuying(item)}
                    onRestore={() => handleRestore(item)}
                  />
                ))}
              </div>
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
            if (categoryId === id) setCategoryId(null)
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
    </div>
  )
}
