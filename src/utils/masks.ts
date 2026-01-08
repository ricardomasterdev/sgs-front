export const masks = {
  cpf: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  },

  // Mascara para data brasileira DD/MM/AAAA
  dateBR: (value: string) => {
    if (!value) return ''
    const digits = value.replace(/\D/g, '').slice(0, 8)
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  },

  // Converte DD/MM/AAAA para YYYY-MM-DD (para API)
  dateToISO: (dateBR: string) => {
    if (!dateBR) return ''
    const digits = dateBR.replace(/\D/g, '')
    if (digits.length !== 8) return ''
    const dia = digits.slice(0, 2)
    const mes = digits.slice(2, 4)
    const ano = digits.slice(4, 8)
    const diaNum = parseInt(dia, 10)
    const mesNum = parseInt(mes, 10)
    const anoNum = parseInt(ano, 10)
    if (diaNum < 1 || diaNum > 31) return ''
    if (mesNum < 1 || mesNum > 12) return ''
    if (anoNum < 1900 || anoNum > 2100) return ''
    return `${ano}-${mes}-${dia}`
  },

  // Converte YYYY-MM-DD para DD/MM/AAAA (do API para exibicao)
  dateFromISO: (dataISO: string) => {
    if (!dataISO) return ''
    if (dataISO.includes('/')) return dataISO
    const parts = dataISO.split('-')
    if (parts.length !== 3) return ''
    const [ano, mes, dia] = parts
    if (!ano || !mes || !dia) return ''
    return `${dia.slice(0, 2)}/${mes}/${ano}`
  },

  cnpj: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  },

  phone: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  },

  cep: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1')
  },

  currency: (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num || 0)
  },

  date: (value: string) => {
    if (!value) return ''
    const date = new Date(value)
    return date.toLocaleDateString('pt-BR')
  },

  dateTime: (value: string) => {
    if (!value) return ''
    const date = new Date(value)
    return date.toLocaleString('pt-BR')
  },

  onlyNumbers: (value: string) => {
    return value.replace(/\D/g, '')
  },
}

export const formatters = {
  currency: (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  },

  percent: (value: number) => {
    return `${value.toFixed(2)}%`
  },

  number: (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  },
}
