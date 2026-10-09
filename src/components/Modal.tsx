import { useCallback, useRef, type ReactNode } from 'react'
import { CloseIcon } from './icons'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Нативный <dialog>: фокус, Esc и затемнение фона браузер делает сам. */
export function Modal({ title, onClose, children }: Props) {
  const dialog = useRef<HTMLDialogElement | null>(null)

  // Открываем прямо в момент вставки в DOM, а не в useEffect:
  // эффект может выполниться позже (или не сразу), и окно останется закрытым.
  const attach = useCallback((el: HTMLDialogElement | null) => {
    dialog.current = el
    if (!el || el.open) return
    if (typeof el.showModal === 'function') el.showModal()
    else el.setAttribute('open', '')
  }, [])

  // Сообщаем родителю сразу, не дожидаясь события close — браузер может доставить его с задержкой.
  const close = () => {
    const el = dialog.current
    if (el?.open && typeof el.close === 'function') el.close()
    onClose()
  }

  return (
    <dialog
      ref={attach}
      className="modal"
      aria-label={title}
      onClose={onClose}
      onCancel={(e) => {
        // Esc: закрываем сами, чтобы onClose точно вызвался
        e.preventDefault()
        close()
      }}
      onClick={(e) => {
        // клик по затемнённому фону
        if (e.target === dialog.current) close()
      }}
    >
      <div className="modal__inner">
        <div className="modal__head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn icon-btn--flat" onClick={close} aria-label="Закрыть">
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
