import { useState, useMemo } from 'react';
import TransactionModal from './TransactionModal';
import './styles/base.css';
import './styles/navbar.css';
import './styles/tabs.css';
import './styles/table.css';
import './styles/inventory.css';
import './styles/modal.css';

const DEFAULT_TRANSACTIONS = [
  {
    id: 'tx-1',
    type: 'expense',
    amount: 230,
    category: 'Impresiones y Consumibles',
    description: 'Compra DTF Textil (1 m)',
    date: '2026-10-04',
    details: '1 m de DTF Textil',
  },
  {
    id: 'tx-2',
    type: 'income',
    amount: 2600,
    category: 'Venta de Playeras',
    description: 'Venta lote (12 pzas a ~$216.67 c/u)',
    date: '2026-11-04',
    details: '12 pzas: 6x Negro [M-Hombre], 6x Blanco [S-Mujer]',
  },
];

// Solo las 4 tallas estándar
const SIZES = ['S', 'M', 'L', 'XL'];
// Solo Hombre y Mujer
const GENDERS = ['Hombre', 'Mujer'];

// Inventario inicial en bodega
const DEFAULT_SHIRT_INVENTORY = [
  {
    id: 'Negro_Hombre',
    color: 'Negro',
    gender: 'Hombre',
    hex: '#111827',
    sizes: { S: 2, M: 18, L: 4, XL: 2 },
  },
  {
    id: 'Blanco_Hombre',
    color: 'Blanco',
    gender: 'Hombre',
    hex: '#ffffff',
    sizes: { S: 4, M: 15, L: 8, XL: 3 },
  },
  {
    id: 'Blanco_Mujer',
    color: 'Blanco',
    gender: 'Mujer',
    hex: '#ffffff',
    sizes: { S: 10, M: 6, L: 2, XL: 0 },
  },
  {
    id: 'Azul_Marino_Hombre',
    color: 'Azul Marino',
    gender: 'Hombre',
    hex: '#111e38',
    sizes: { S: 1, M: 4, L: 6, XL: 2 },
  },
  {
    id: 'Rojo_Hombre',
    color: 'Rojo',
    gender: 'Hombre',
    hex: '#dc2626',
    sizes: { S: 0, M: 4, L: 2, XL: 1 },
  },
];

const PRESET_COLORS = [
  { name: 'Negro', hex: '#111827' },
  { name: 'Blanco', hex: '#ffffff' },
  { name: 'Gris Jaspe', hex: '#64748b' },
  { name: 'Azul Marino', hex: '#111e38' },
  { name: 'Azul Rey', hex: '#1d4ed8' },
  { name: 'Rojo', hex: '#dc2626' },
  { name: 'Vino / Tinto', hex: '#4c0519' },
  { name: 'Verde Militar', hex: '#2d3b22' },
  { name: 'Mostaza', hex: '#ca8a04' },
  { name: 'Beige / Arena', hex: '#d4c5a9' },
  { name: 'Rosa Pastel', hex: '#f472b6' },
];

const QUARTERS = [
  { id: 'Q1', name: 'Q1 (Ene - Mar)', startMonth: 0, endMonth: 2 },
  { id: 'Q2', name: 'Q2 (Abr - Jun)', startMonth: 3, endMonth: 5 },
  { id: 'Q3', name: 'Q3 (Jul - Sep)', startMonth: 6, endMonth: 8 },
  { id: 'Q4', name: 'Q4 (Oct - Dic)', startMonth: 9, endMonth: 11 },
];

function isColorLight(hex) {
  if (!hex) return false;
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  return luminance >= 165;
}

export default function MoneyControl() {
  const [activeTab, setActiveTab] = useState('inventory'); // 'transactions' | 'inventory'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState(null);

  // Estados de variantes
  const [isAddShirtModalOpen, setIsAddShirtModalOpen] = useState(false);
  const [shirtToDelete, setShirtToDelete] = useState(null);

  // Formulario para crear nueva tarjeta Color + Género
  const [newShirtColorName, setNewShirtColorName] = useState('');
  const [newShirtHex, setNewShirtHex] = useState('#38bdf8');
  const [newShirtGender, setNewShirtGender] = useState('Hombre');

  // Filtros de fecha
  const [filterMode, setFilterMode] = useState('quarter');
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const defaultQuarterId = `Q${Math.floor(currentMonth / 3) + 1}`;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState(defaultQuarterId);

  // Filtro de inventario: únicamente Género (Todos, Hombre, Mujer)
  const [inventoryGenderFilter, setInventoryGenderFilter] = useState('Todos');

  // Transacciones
  const [transactions, setTransactions] = useState(() => {
    try {
      const stored = localStorage.getItem('money_control_db');
      return stored ? JSON.parse(stored) : DEFAULT_TRANSACTIONS;
    } catch {
      return DEFAULT_TRANSACTIONS;
    }
  });

  // Inventario de Playeras
  const [inventory, setInventory] = useState(() => {
    try {
      const stored = localStorage.getItem('shirt_inventory_db_grouped_4s');
      return stored ? JSON.parse(stored) : DEFAULT_SHIRT_INVENTORY;
    } catch {
      return DEFAULT_SHIRT_INVENTORY;
    }
  });

  const saveTransactions = (data) => {
    setTransactions(data);
    localStorage.setItem('money_control_db', JSON.stringify(data));
  };

  const saveInventory = (data) => {
    setInventory(data);
    localStorage.setItem('shirt_inventory_db_grouped_4s', JSON.stringify(data));
  };

  const handleSaveTransaction = (newTx) => {
    saveTransactions([newTx, ...transactions]);
  };

  const promptDeleteTx = (tx) => setTxToDelete(tx);
  const cancelDeleteTx = () => setTxToDelete(null);
  const confirmDeleteTx = () => {
    if (txToDelete) {
      saveTransactions(transactions.filter((t) => t.id !== txToDelete.id));
      setTxToDelete(null);
    }
  };

  const handleDateChange = (id, newDate) => {
    if (!newDate) return;
    const updated = transactions.map((t) => (t.id === id ? { ...t, date: newDate } : t));
    saveTransactions(updated);
  };

  // Ajuste rápido de stock por talla específica (S, M, L, XL)
  const handleStockChange = (cardId, size, delta) => {
    const updated = inventory.map((card) => {
      if (card.id === cardId) {
        const currentQty = card.sizes[size] || 0;
        const newQty = Math.max(0, currentQty + delta);
        return {
          ...card,
          sizes: {
            ...card.sizes,
            [size]: newQty,
          },
        };
      }
      return card;
    });
    saveInventory(updated);
  };

  const promptDeleteShirt = (item) => setShirtToDelete(item);
  const cancelDeleteShirt = () => setShirtToDelete(null);
  const confirmDeleteShirt = () => {
    if (shirtToDelete) {
      saveInventory(inventory.filter((item) => item.id !== shirtToDelete.id));
      setShirtToDelete(null);
    }
  };

  const handleCreateShirtSubmit = (e) => {
    e.preventDefault();

    const trimmedName = newShirtColorName.trim();
    if (!trimmedName) {
      alert('Por favor ingresa el nombre del color.');
      return;
    }

    const generatedId = `${trimmedName}_${newShirtGender}`.replace(/\s+/g, '_');

    const exists = inventory.find((i) => i.id === generatedId);
    if (exists) {
      alert(`Ya existe una tarjeta para ${trimmedName} (${newShirtGender}).`);
      return;
    }

    const newCard = {
      id: generatedId,
      color: trimmedName,
      gender: newShirtGender,
      hex: newShirtHex,
      sizes: { S: 0, M: 0, L: 0, XL: 0 },
    };

    saveInventory([newCard, ...inventory]);
    setNewShirtColorName('');
    setNewShirtHex('#38bdf8');
    setIsAddShirtModalOpen(false);
  };

  const getCardTotalUnits = (card) => {
    return Object.values(card.sizes || {}).reduce((acc, qty) => acc + (Number(qty) || 0), 0);
  };

  const totalShirtsStock = useMemo(() => {
    return inventory.reduce((totalAcc, card) => {
      const cardTotal = Object.values(card.sizes || {}).reduce((acc, qty) => acc + (Number(qty) || 0), 0);
      return totalAcc + cardTotal;
    }, 0);
  }, [inventory]);

  const availableYears = useMemo(() => {
    const yearsSet = new Set([currentYear, currentYear - 1, currentYear + 1]);
    transactions.forEach((tx) => {
      if (tx.date) {
        const y = parseInt(tx.date.split('-')[0], 10);
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterMode === 'total') return true;
      if (!tx.date) return false;

      const [yStr, mStr] = tx.date.split('-');
      const txYear = parseInt(yStr, 10);
      const txMonth = parseInt(mStr, 10) - 1;

      if (filterMode === 'year') {
        return txYear === Number(selectedYear);
      }

      if (filterMode === 'quarter') {
        if (txYear !== Number(selectedYear)) return false;
        const qConfig = QUARTERS.find((q) => q.id === selectedQuarter);
        if (!qConfig) return true;
        return txMonth >= qConfig.startMonth && txMonth <= qConfig.endMonth;
      }

      return true;
    });
  }, [transactions, filterMode, selectedYear, selectedQuarter]);

  const filteredMetrics = useMemo(() => {
    let s = 0;
    let e = 0;
    filteredTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') s += amt;
      if (tx.type === 'expense') e += amt;
    });
    return { sales: s, expenses: e, total: s - e };
  }, [filteredTransactions]);

  // Filtrado de inventario únicamente por Hombre / Mujer / Todos
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      return inventoryGenderFilter === 'Todos' || item.gender === inventoryGenderFilter;
    });
  }, [inventory, inventoryGenderFilter]);

  const formatMoney = (val) => `$${Number(val).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  const getPeriodLabel = () => {
    if (filterMode === 'total') return 'Histórico Total';
    if (filterMode === 'year') return `Año ${selectedYear}`;
    if (filterMode === 'quarter') {
      const q = QUARTERS.find((item) => item.id === selectedQuarter);
      return `${q ? q.name : selectedQuarter} - ${selectedYear}`;
    }
    return '';
  };

  const getColorHex = (item) => {
    if (item.hex) return item.hex;
    const match = PRESET_COLORS.find((c) => c.name.toLowerCase() === item.color.toLowerCase());
    return match ? match.hex : '#38bdf8';
  };

  return (
    <div className="money-page">
      {/* NAVBAR */}
      <header className="money-nav">
        <div className="nav-title-group">
          <span className="brand-badge">SAD KOALA</span>
          <h1 className="brand-title">Control Financiero</h1>
        </div>

        <div className="nav-controls-and-metrics">
          <div className="period-toggle-box">
            <div className={`period-button-group ${filterMode === 'quarter' ? 'active-group' : ''}`}>
              <button
                type="button"
                className={`btn-period ${filterMode === 'quarter' ? 'active' : ''}`}
                onClick={() => setFilterMode('quarter')}
              >
                Trimestre
              </button>
              {filterMode === 'quarter' && (
                <div className="inline-select-group">
                  <select
                    className="period-sub-select"
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(e.target.value)}
                  >
                    {QUARTERS.map((q) => (
                      <option key={q.id} value={q.id}>{q.name}</option>
                    ))}
                  </select>
                  <select
                    className="period-sub-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className={`period-button-group ${filterMode === 'year' ? 'active-group' : ''}`}>
              <button
                type="button"
                className={`btn-period ${filterMode === 'year' ? 'active' : ''}`}
                onClick={() => setFilterMode('year')}
              >
                Año
              </button>
              {filterMode === 'year' && (
                <div className="inline-select-group">
                  <select
                    className="period-sub-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              type="button"
              className={`btn-period ${filterMode === 'total' ? 'active' : ''}`}
              onClick={() => setFilterMode('total')}
            >
              Total
            </button>
          </div>

          {/* CAJAS DE MÉTRICAS INTERACTIVAS QUE SIRVEN DE MENÚ */}
          <nav className="nav-metrics-container">
            <div
              className={`metric-box box-sales metric-nav-btn ${activeTab === 'transactions' ? 'active-nav-card' : ''}`}
              onClick={() => setActiveTab('transactions')}
              title="Ver Historial de Movimientos"
            >
              <span className="metric-lbl">Ventas ({filterMode === 'total' ? 'Total' : filterMode === 'year' ? selectedYear : selectedQuarter})</span>
              <span className="metric-val">{formatMoney(filteredMetrics.sales)}</span>
            </div>

            <div
              className={`metric-box box-expenses metric-nav-btn ${activeTab === 'transactions' ? 'active-nav-card' : ''}`}
              onClick={() => setActiveTab('transactions')}
              title="Ver Historial de Movimientos"
            >
              <span className="metric-lbl">Gastos ({filterMode === 'total' ? 'Total' : filterMode === 'year' ? selectedYear : selectedQuarter})</span>
              <span className="metric-val">{formatMoney(filteredMetrics.expenses)}</span>
            </div>

            {/* BOTÓN 1: NETO -> ABRE HISTORIAL DE MOVIMIENTOS */}
            <div
              className={`metric-box metric-nav-btn ${filteredMetrics.total >= 0 ? 'box-total-pos' : 'box-total-neg'} ${activeTab === 'transactions' ? 'active-nav-card' : ''}`}
              onClick={() => setActiveTab('transactions')}
              title="Clic para ver Historial de Movimientos"
            >
              <span className="metric-lbl">Neto ({filterMode === 'total' ? 'Total' : filterMode === 'year' ? selectedYear : selectedQuarter})</span>
              <span className="metric-val">{formatMoney(filteredMetrics.total)}</span>
            </div>

            {/* BOTÓN 2: PLAYERAS STOCK -> ABRE ALMACÉN DE PLAYERAS */}
            <div
              className={`metric-box box-shirts-total metric-nav-btn ${activeTab === 'inventory' ? 'active-nav-card' : ''}`}
              onClick={() => setActiveTab('inventory')}
              title="Clic para ver Almacén de Playeras"
            >
              <span className="metric-lbl">Playeras Stock</span>
              <span className="metric-val metric-val-shirts">{totalShirtsStock} <span className="metric-unit">pzas</span></span>
            </div>
          </nav>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="money-main">
        {/* VISTA 1: HISTORIAL DE MOVIMIENTOS */}
        {activeTab === 'transactions' && (
          <>
            <div className="table-top-bar">
              <h2 className="section-title">
                Historial de Movimientos <span className="period-subtitle">({getPeriodLabel()})</span>
              </h2>
              <button
                type="button"
                className="btn-create-modal"
                onClick={() => setIsModalOpen(true)}
              >
                + Registrar Venta / Compra
              </button>
            </div>

            <div className="block-table-container">
              <div className="block-row block-header-row">
                <div className="block-cell header-cell cell-date-header">Fecha</div>
                <div className="block-cell header-cell">Tipo</div>
                <div className="block-cell header-cell">Categoría</div>
                <div className="block-cell header-cell cell-desc">Detalle & Desglose</div>
                <div className="block-cell header-cell">Monto</div>
                <div className="block-cell header-cell cell-action">Acción</div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="empty-box">
                  No hay movimientos registrados para <strong>{getPeriodLabel()}</strong>.
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div key={tx.id} className="block-row data-row">
                    <div className="block-cell cell-date">
                      <input
                        type="date"
                        className="table-date-input"
                        value={tx.date}
                        onChange={(e) => handleDateChange(tx.id, e.target.value)}
                        title="Haz clic para modificar la fecha"
                      />
                    </div>

                    <div className="block-cell">
                      <span className={`badge-pill ${tx.type === 'income' ? 'pill-income' : 'pill-expense'}`}>
                        {tx.type === 'income' ? 'VENTA' : 'GASTO'}
                      </span>
                    </div>

                    <div className="block-cell cell-cat">{tx.category}</div>

                    <div className="block-cell cell-desc">
                      <span className="desc-main-text">{tx.description}</span>
                      {tx.details && <span className="desc-sub-text">{tx.details}</span>}
                    </div>

                    <div className={`block-cell cell-amount ${tx.type === 'income' ? 'txt-income' : 'txt-expense'}`}>
                      {tx.type === 'income' ? `+${formatMoney(tx.amount)}` : `-${formatMoney(tx.amount)}`}
                    </div>

                    <div className="block-cell cell-action">
                      <button
                        type="button"
                        className="btn-delete-row"
                        onClick={() => promptDeleteTx(tx)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* VISTA 2: ALMACÉN CON BOTONES DE GÉNERO (SOLO HOMBRE Y MUJER) */}
        {activeTab === 'inventory' && (
          <section className="inventory-section">
            <div className="inventory-header">
              <div className="inventory-title-group">
                <h2 className="section-title">Control de Playeras en Bodega</h2>
                <div className="stock-total-badge">
                  Total Almacenado: <strong>{totalShirtsStock} piezas</strong>
                </div>

                <button
                  type="button"
                  className="btn-add-shirt-card"
                  onClick={() => setIsAddShirtModalOpen(true)}
                >
                  + Crear Nuevo Color
                </button>
              </div>

              {/* BARRA SUPERIOR: ÚNICAMENTE TODOS / HOMBRE / MUJER */}
              <div className="inventory-controls-bar">
                <div className="gender-toggle-group">
                  <button
                    type="button"
                    className={`btn-gender-filter ${inventoryGenderFilter === 'Todos' ? 'active' : ''}`}
                    onClick={() => setInventoryGenderFilter('Todos')}
                    title="Mostrar todos los géneros"
                  >
                    👥 Todos
                  </button>
                  <button
                    type="button"
                    className={`btn-gender-filter btn-gender-male ${inventoryGenderFilter === 'Hombre' ? 'active' : ''}`}
                    onClick={() => setInventoryGenderFilter('Hombre')}
                    title="Solo playeras de Hombre"
                  >
                    <span className="gender-symbol">♂</span> Hombre
                  </button>
                  <button
                    type="button"
                    className={`btn-gender-filter btn-gender-female ${inventoryGenderFilter === 'Mujer' ? 'active' : ''}`}
                    onClick={() => setInventoryGenderFilter('Mujer')}
                    title="Solo playeras de Mujer"
                  >
                    <span className="gender-symbol">♀</span> Mujer
                  </button>
                </div>
              </div>
            </div>

            {filteredInventory.length === 0 ? (
              <div className="empty-box">
                No hay playeras que coincidan con el género seleccionado o el inventario está vacío.
              </div>
            ) : (
              <div className="inventory-matrix-grid">
                {filteredInventory.map((item) => {
                  const hexColor = getColorHex(item);
                  const isLight = isColorLight(hexColor);
                  const cardTotal = getCardTotalUnits(item);

                  return (
                    <div
                      key={item.id}
                      className={`inventory-matrix-card shirt-colored-card ${isLight ? 'card-theme-light' : 'card-theme-dark'}`}
                      style={{ '--card-shirt-color': hexColor }}
                    >
                      <div className="inv-matrix-header">
                        <div className="inv-matrix-title-wrap">
                          <span className="inv-color-title" title={item.color}>
                            {item.color}
                          </span>
                          <span className="inv-tag">
                            {item.gender === 'Hombre' && '♂ '}
                            {item.gender === 'Mujer' && '♀ '}
                            {item.gender}
                          </span>
                        </div>

                        <div className="inv-matrix-header-right">
                          <span className="inv-card-total-pill">
                            Total: <strong>{cardTotal}</strong> pzas
                          </span>
                          <button
                            type="button"
                            className="btn-remove-shirt-card"
                            onClick={() => promptDeleteShirt(item)}
                            title="Eliminar este color/corte"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="inv-sizes-matrix">
                        {SIZES.map((size) => {
                          const qty = item.sizes?.[size] || 0;
                          return (
                            <div key={size} className="size-row-pill">
                              <span className="size-label">{size}</span>
                              <span className="size-qty-num">{qty}</span>

                              <div className="size-btn-group">
                                <button
                                  type="button"
                                  className="btn-mini-qty"
                                  onClick={() => handleStockChange(item.id, size, -1)}
                                  disabled={qty === 0}
                                  title={`Restar 1 ${size}`}
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  className="btn-mini-qty"
                                  onClick={() => handleStockChange(item.id, size, 1)}
                                  title={`Sumar 1 ${size}`}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* MODAL: CREAR NUEVO COLOR EN BODEGA */}
      {isAddShirtModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container add-shirt-modal-container">
            <div className="modal-header">
              <h3 className="money-form-title">🎨 Crear Nuevo Color en Bodega</h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setIsAddShirtModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShirtSubmit} className="form-flow">
              <div className="form-base-row-step1">
                <div className="form-group">
                  <label>Nombre del Color</label>
                  <input
                    type="text"
                    className="money-input"
                    placeholder="Ej. Terracota, Menta, Mostaza..."
                    value={newShirtColorName}
                    onChange={(e) => setNewShirtColorName(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tono Visual</label>
                  <div className="color-picker-input-group">
                    <input
                      type="color"
                      className="native-color-picker"
                      value={newShirtHex}
                      onChange={(e) => setNewShirtHex(e.target.value)}
                    />
                    <input
                      type="text"
                      className="money-input"
                      value={newShirtHex}
                      onChange={(e) => setNewShirtHex(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Género / Corte</label>
                <select
                  className="money-select"
                  value={newShirtGender}
                  onChange={(e) => setNewShirtGender(e.target.value)}
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions-right">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsAddShirtModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="money-btn-submit btn-confirm-table">
                  Crear Tarjeta de Color ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR REMOVER TARJETA DE PLAYERA */}
      {shirtToDelete && (
        <div className="modal-overlay delete-modal-overlay">
          <div className="modal-container delete-modal-container">
            <div className="delete-modal-header">
              <span className="delete-warning-icon">⚠</span>
              <h3 className="delete-modal-title">¿Remover esta tarjeta de bodega?</h3>
            </div>

            <p className="delete-modal-message">
              Estás a punto de quitar este color y todas sus tallas del panel de almacén:
            </p>

            <div className="delete-preview-card">
              <div className="delete-preview-row">
                <span className="preview-label">Color:</span>
                <strong className="preview-val-title">{shirtToDelete.color}</strong>
              </div>
              <div className="delete-preview-row">
                <span className="preview-label">Corte:</span>
                <span className="preview-val-sub">{shirtToDelete.gender}</span>
              </div>
              <div className="delete-preview-row">
                <span className="preview-label">Total en Tallas:</span>
                <strong className="preview-val-amt txt-preview-stock-blue">
                  {getCardTotalUnits(shirtToDelete)} piezas
                </strong>
              </div>
            </div>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn-delete-cancel"
                onClick={cancelDeleteShirt}
              >
                Regresar
              </button>
              <button
                type="button"
                className="btn-delete-confirm"
                onClick={confirmDeleteShirt}
              >
                Sí, remover tarjeta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINAR TRANSACCIÓN */}
      {txToDelete && (
        <div className="modal-overlay delete-modal-overlay">
          <div className="modal-container delete-modal-container">
            <div className="delete-modal-header">
              <span className="delete-warning-icon">⚠</span>
              <h3 className="delete-modal-title">¿Eliminar este movimiento?</h3>
            </div>

            <p className="delete-modal-message">
              Estás a punto de borrar permanentemente el siguiente registro del historial:
            </p>

            <div className="delete-preview-card">
              <div className="delete-preview-row">
                <span className="preview-label">Concepto:</span>
                <strong className="preview-val-title">{txToDelete.description}</strong>
              </div>
              <div className="delete-preview-row">
                <span className="preview-label">Detalle:</span>
                <span className="preview-val-sub">{txToDelete.details || txToDelete.category}</span>
              </div>
              <div className="delete-preview-row">
                <span className="preview-label">Fecha y Monto:</span>
                <span className="preview-val-amt">
                  {txToDelete.date} &bull;{' '}
                  <strong className={txToDelete.type === 'income' ? 'txt-income' : 'txt-expense'}>
                    {txToDelete.type === 'income' ? `+${formatMoney(txToDelete.amount)}` : `-${formatMoney(txToDelete.amount)}`}
                  </strong>
                </span>
              </div>
            </div>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn-delete-cancel"
                onClick={cancelDeleteTx}
              >
                Regresar
              </button>
              <button
                type="button"
                className="btn-delete-confirm"
                onClick={confirmDeleteTx}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO DE VENTA/COMPRA */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
      />
    </div>
  );
}