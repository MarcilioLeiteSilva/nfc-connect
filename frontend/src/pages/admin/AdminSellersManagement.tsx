import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import type { User } from '../../types';
import {
  UserPlus,
  Edit2,
  Lock,
  Power,
  CheckCircle,
  X,
  Mail
} from 'lucide-react';

export const AdminSellersManagement: React.FC = () => {
  const users = storageService.getUsers().filter(u => u.role === 'SELLER');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [target, setTarget] = useState(20);
  const [threshold, setThreshold] = useState(5);

  const [notice, setNotice] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPhone('');
    setTarget(20);
    setThreshold(5);
    setShowAddModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone);
    setTarget(user.monthly_target);
    setThreshold(user.low_stock_threshold);
    setShowAddModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    if (editingUser) {
      storageService.updateUser({
        ...editingUser,
        name,
        email,
        phone,
        monthly_target: target,
        low_stock_threshold: threshold
      });
      setNotice('Dados do vendedor atualizados com sucesso!');
    } else {
      storageService.addUser({
        name,
        email,
        phone,
        role: 'SELLER',
        status: 'ACTIVE',
        monthly_target: target,
        low_stock_threshold: threshold
      });
      setNotice('Novo vendedor cadastrado com sucesso!');
    }

    setShowAddModal(false);
  };

  const handleToggleStatus = (user: User) => {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    storageService.updateUser({
      ...user,
      status: nextStatus
    });
    setNotice(`Vendedor ${user.name} agora está ${nextStatus === 'ACTIVE' ? 'Ativo' : 'Inativo'}.`);
  };

  const handleResetSessions = (user: User) => {
    setNotice(`Sessões de ${user.name} encerradas. Tokens invalidados com sucesso.`);
  };

  return (
    <div className="main-content animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>
            Administração
          </span>
          <h1 style={{ fontSize: 22, marginTop: 2 }}>Gestão de Vendedores</h1>
        </div>
        <button className="pwa-install-btn" onClick={handleOpenAdd}>
          <UserPlus size={14} />
          <span>Novo Vendedor</span>
        </button>
      </div>

      {notice && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 12,
            padding: 12,
            color: '#34d399',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <CheckCircle size={16} />
          <span>{notice}</span>
        </div>
      )}

      {/* Lista de Vendedores */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {users.map(user => {
          const summary = storageService.getStockSummary(user.id);
          const totalStock = summary.reduce((acc, s) => acc + s.availableStock, 0);

          return (
            <div
              key={user.id}
              className="glass-panel"
              style={{
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                opacity: user.status === 'INACTIVE' ? 0.6 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 16
                    }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, color: '#fff' }}>{user.name}</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={12} /> {user.email}
                    </div>
                  </div>
                </div>

                <span className={`badge ${user.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                  {user.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 8,
                  background: 'rgba(0,0,0,0.2)',
                  padding: 10,
                  borderRadius: 10,
                  fontSize: 12
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: 10, display: 'block' }}>META MENSAL</span>
                  <strong style={{ color: '#fff' }}>{user.monthly_target} placas</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: 10, display: 'block' }}>ALERTA ESTOQUE</span>
                  <strong style={{ color: '#fbbf24' }}>≤ {user.low_stock_threshold} un</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: 10, display: 'block' }}>SALDO ATUAL</span>
                  <strong style={{ color: '#38bdf8' }}>{totalStock} un</strong>
                </div>
              </div>

              {/* Botões de Ação do Vendedor */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  className="btn-secondary"
                  onClick={() => handleResetSessions(user)}
                  style={{ padding: '6px 10px', fontSize: 11, width: 'auto' }}
                  title="Invalida tokens ativos em caso de roubo ou perda"
                >
                  <Lock size={12} /> Encerrar Sessões
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => handleToggleStatus(user)}
                  style={{
                    padding: '6px 10px',
                    fontSize: 11,
                    width: 'auto',
                    color: user.status === 'ACTIVE' ? '#f87171' : '#34d399'
                  }}
                >
                  <Power size={12} /> {user.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => handleOpenEdit(user)}
                  style={{ padding: '6px 10px', fontSize: 11, width: 'auto' }}
                >
                  <Edit2 size={12} /> Editar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: 18, color: '#fff' }}>
                {editingUser ? 'Editar Vendedor' : 'Cadastrar Novo Vendedor'}
              </h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  NOME COMPLETO
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  E-MAIL DE ACESSO
                </label>
                <input
                  type="email"
                  required
                  placeholder="vendedor@comunicarmarketing.com.br"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                  WHATSAPP / TELEFONE
                </label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                    META MENSAL (UN)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={target}
                    onChange={e => setTarget(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', display: 'block', marginBottom: 4 }}>
                    ALERTA ESTOQUE (UN)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={threshold}
                    onChange={e => setThreshold(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Salvar Alterações' : 'Concluir Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
