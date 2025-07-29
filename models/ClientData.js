const mongoose = require('mongoose');

const clientDataSchema = new mongoose.Schema({
  DATA: {
    type: String,
    required: [true, 'Date is required'],
    trim: true
  },
  RECEBER_VP: {
    type: Number,
    required: [true, 'RECEBER_VP is required'],
    default: 0
  },
  PAGAR_VP: {
    type: Number,
    required: [true, 'PAGAR_VP is required'],
    default: 0
  },
  RECEBER_TGN: {
    type: Number,
    required: [true, 'RECEBER_TGN is required'],
    default: 0
  },
  PAGAR_TGN: {
    type: Number,
    required: [true, 'PAGAR_TGN is required'],
    default: 0
  },
  TOTAL_RECEBER: {
    type: Number,
    required: [true, 'TOTAL_RECEBER is required'],
    default: 0
  },
  TOTAL_A_PAGAR: {
    type: Number,
    required: [true, 'TOTAL_A_PAGAR is required'],
    default: 0
  },
  SALDO_DIARIO: {
    type: Number,
    required: [true, 'SALDO_DIARIO is required'],
    default: 0
  },
  SALDO_ACUMULADO: {
    type: Number,
    required: [true, 'SALDO_ACUMULADO is required'],
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
clientDataSchema.index({ DATA: 1 }, { unique: true }); // Unique index to ensure each date appears only once
clientDataSchema.index({ uploadedBy: 1 });
clientDataSchema.index({ uploadDate: -1 });

// Virtual for formatted currency values
clientDataSchema.virtual('formattedValues').get(function() {
  return {
    RECEBER_VP: `R$ ${this.RECEBER_VP.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    PAGAR_VP: `R$ ${this.PAGAR_VP.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    RECEBER_TGN: `R$ ${this.RECEBER_TGN.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    PAGAR_TGN: `R$ ${this.PAGAR_TGN.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    TOTAL_RECEBER: `R$ ${this.TOTAL_RECEBER.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    TOTAL_A_PAGAR: `R$ ${this.TOTAL_A_PAGAR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    SALDO_DIARIO: `R$ ${this.SALDO_DIARIO.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    SALDO_ACUMULADO: `R$ ${this.SALDO_ACUMULADO.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  };
});

const ClientData = mongoose.model('ClientData', clientDataSchema);

module.exports = ClientData; 