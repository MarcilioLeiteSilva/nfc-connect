import React, { useState } from 'react';
import type { ProductId, User } from '../../types';
import { storageService } from '../../services/storageService';
import { InstagramIcon } from '../../components/InstagramIcon';
import {
  Star,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Check,
  Building2
} from 'lucide-react';

interface SellerNewSaleProps {
  currentUser: User;
  isOnline: boolean;
  onSaleSuccess: () => void;
}

export const SellerNewSale: React.FC<SellerNewSaleProps> = ({
  currentUser,
  isOnline,
  onSaleSuccess
}) => {
  const [productId, setProductId] = useState<ProductId>('google');
  const [establishmentName, setEstablishmentName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [nfcConfigured, setNfcConfigured] = useState(false);
  const [qrcodeTested, setQrcodeTested] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ message: string; commission: number; total: number } | null>(null);

  const availableStock = storageService.getAvailableStock(currentUser.id, productId);

  const unitPrice = 90.0;
  const unitCommission = 20.0;
  const totalPrice = quantity * unitPrice;
  const totalCommission = quantity * unitCommission;

  const handleSelectProduct = (id: ProductId) => {
    setProductId(id);
    setErrorMessage(null);
  };

  const handleQuantityChange = (delta: number) => {
    const nextVal = quantity + delta;
    if (nextVal >= 1 && nextVal <= Math.max(1, availableStock)) {
      setQuantity(nextVal);
      setErrorMessage(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!establishmentName.trim()) {
      setErrorMessage('Por favor, digite o nome do estabelecimento.');
      return;
    }

    if (availableStock <= 0) {
      setErrorMessage('Você não possui estoque deste modelo disponível.');
      return;
    }

    if (quantity > availableStock) {
      setErrorMessage(`Estoque insuficiente! Saldo atual: ${availableStock} placa(s).`);
      return;
    }

    if (!nfcConfigured || !qrcodeTested) {
      setErrorMessage('Confirmação obrigatória: marque os 2 testes (NFC configurado e QR Code testado).');
      return;
    }

    const result = storageService.registerSale({
      sellerId: currentUser.id,
      productId,
      establishmentName,
      quantity,
      nfcConfigured,
      qrcodeTested,
      isOffline: !isOnline
    });

    if (result.success) {
      setSuccessResult({
        message: result.message,
        commission: totalCommission,
        total: totalPrice
      });
    } else {
      setErrorMessage(result.message);
    }
  };

  if (successResult) {
    return (
      <div className="main-content animate-fade-in" style={{ textAlign: 'center', padding: '30px 16px' }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            border: '2px solid rgba(16, 185, 129, 0.5)',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)'
          }}
        >
          <CheckCircle size={48} />
        </div>

        <h2 style={{ fontSize: 24, color: '#fff', marginBottom: 8 }}>Venda Concluída!</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
          {successResult.message}
        </p>

        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span>Valor Cobrado:</span>
            <strong style={{ color: '#fff' }}>
              R$ {successResult.total.toFixed(2).replace('.', ',')}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span>Sua Comissão Gerada:</span>
            <strong style={{ color: '#34d399', fontSize: 18 }}>
              + R$ {successResult.commission.toFixed(2).replace('.', ',')}
            </strong>
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={() => {
            setSuccessResult(null);
            setEstablishmentName('');
            setQuantity(1);
            setNfcConfigured(false);
            setQrcodeTested(false);
            onSaleSuccess();
          }}
        >
          Concluir e Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div className="main-content animate-fade-in">
      <div>
        <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>
          Ativação no Balcão
        </span>
        <h1 style={{ fontSize: 22, marginTop: 2 }}>Registrar Venda</h1>
      </div>

      {errorMessage && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 12,
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#f87171',
            fontSize: 13
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 1. SELEÇÃO DO PRODUTO */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 8 }}>
            1. SELECIONE A PLACA
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {/* Botão Placa Google */}
            <button
              type="button"
              onClick={() => handleSelectProduct('google')}
              style={{
                padding: 14,
                borderRadius: 14,
                border: productId === 'google' ? '2px solid #3b82f6' : '1px solid var(--border-subtle)',
                background:
                  productId === 'google'
                    ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.2) 0%, rgba(14, 20, 36, 0.9) 100%)'
                    : 'var(--bg-surface-elevated)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 6,
                boxShadow: productId === 'google' ? '0 0 20px rgba(59, 130, 246, 0.25)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Star size={20} color="#60a5fa" fill={productId === 'google' ? '#3b82f6' : 'none'} />
                {productId === 'google' && <Check size={16} color="#3b82f6" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Placa Google</span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Avaliações 5★</span>
            </button>

            {/* Botão Placa Instagram */}
            <button
              type="button"
              onClick={() => handleSelectProduct('instagram')}
              style={{
                padding: 14,
                borderRadius: 14,
                border: productId === 'instagram' ? '2px solid #ec4899' : '1px solid var(--border-subtle)',
                background:
                  productId === 'instagram'
                    ? 'linear-gradient(180deg, rgba(236, 72, 153, 0.2) 0%, rgba(14, 20, 36, 0.9) 100%)'
                    : 'var(--bg-surface-elevated)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 6,
                boxShadow: productId === 'instagram' ? '0 0 20px rgba(236, 72, 153, 0.25)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <InstagramIcon size={20} color="#f472b6" />
                {productId === 'instagram' && <Check size={16} color="#ec4899" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Placa Instagram</span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Seguidores/Direct</span>
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 8,
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.2)',
              fontSize: 12
            }}
          >
            <span>Saldo em mãos deste modelo:</span>
            <strong style={{ color: availableStock > 0 ? '#34d399' : '#f87171' }}>
              {availableStock} unidade(s)
            </strong>
          </div>
        </div>

        {/* 2. ESTABELECIMENTO */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 6 }}>
            2. NOME DO ESTABELECIMENTO COMPRADOR
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Ex: Padaria Bella Vista, Barbearia Don..."
              value={establishmentName}
              onChange={e => setEstablishmentName(e.target.value)}
              style={{ width: '100%', paddingLeft: 40 }}
              required
            />
            <Building2
              size={18}
              color="var(--text-dim)"
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>

        {/* 3. QUANTIDADE */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 6 }}>
            3. QUANTIDADE DE PLACAS
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'var(--bg-surface-elevated)',
                color: '#fff',
                fontSize: 20,
                fontWeight: 800,
                border: '1px solid var(--border-subtle)',
                opacity: quantity <= 1 ? 0.3 : 1
              }}
            >
              -
            </button>

            <div
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 24,
                fontWeight: 800,
                color: '#fff',
                background: 'var(--bg-surface-elevated)',
                padding: '10px 0',
                borderRadius: 12,
                border: '1px solid var(--border-subtle)'
              }}
            >
              {quantity} <span style={{ fontSize: 14, color: 'var(--text-dim)', fontWeight: 500 }}>placa(s)</span>
            </div>

            <button
              type="button"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= availableStock}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'var(--bg-surface-elevated)',
                color: '#fff',
                fontSize: 20,
                fontWeight: 800,
                border: '1px solid var(--border-subtle)',
                opacity: quantity >= availableStock ? 0.3 : 1
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* RESUMO DE VALORES E COMISSÃO */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(14, 20, 36, 0.8) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 14,
            padding: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
              TOTAL DA VENDA (R$ 90/un)
            </span>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
              SUA COMISSÃO
            </span>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#34d399' }}>
              + R$ {totalCommission.toFixed(2).replace('.', ',')}
            </div>
          </div>
        </div>

        {/* 4. CHECKLIST OBRIGATÓRIO (NFC & QR CODE TESTADOS) */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 8 }}>
            4. TESTES OBRIGATÓRIOS NO BALCÃO
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Toggle NFC */}
            <div
              onClick={() => setNfcConfigured(!nfcConfigured)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                background: nfcConfigured ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-elevated)',
                border: nfcConfigured ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: nfcConfigured ? '#10b981' : 'transparent',
                  border: nfcConfigured ? 'none' : '2px solid var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0
                }}
              >
                {nfcConfigured && <Check size={16} strokeWidth={3} />}
              </div>
              <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
                Placa NFC gravada e testada por aproximação
              </div>
            </div>

            {/* Toggle QR Code */}
            <div
              onClick={() => setQrcodeTested(!qrcodeTested)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                background: qrcodeTested ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-elevated)',
                border: qrcodeTested ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: qrcodeTested ? '#10b981' : 'transparent',
                  border: qrcodeTested ? 'none' : '2px solid var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0
                }}
              >
                {qrcodeTested && <Check size={16} strokeWidth={3} />}
              </div>
              <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
                QR Code testado com a câmera do celular
              </div>
            </div>
          </div>
        </div>

        {/* BOTÃO FINAL DE CONFIRMAÇÃO */}
        <button
          type="submit"
          className="btn-primary"
          disabled={availableStock <= 0}
          style={{
            marginTop: 8,
            padding: 16,
            fontSize: 16,
            opacity: availableStock <= 0 ? 0.5 : 1
          }}
        >
          <ShieldCheck size={20} />
          <span>Confirmar Venda e Baixar Estoque</span>
        </button>
      </form>
    </div>
  );
};
