// Textos de validação, idênticos aos das APIs (auth: MessageError.cs; command: MensagensErroConst.cs).
export const MSG = {
  obrigatorio: "O campo é obrigatório.",
  formato: "Formato inválido.",
  maxAuth: (n: number) => `O valor não pode exceder ${n} caracteres.`,
  minAuth: (n: number) => `O valor precisa ter no mínimo ${n} caracteres.`,
  complexidade:
    "A senha deve conter pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial.",
  maxCommand: (n: number) => `O tamanho do campo deve ser no máximo ${n}.`,
  entre: (de: number, ate: number) => `O valor do campo deve estar entre ${de} e ${ate}.`,
  maiorQue: (v: string | number) => `O valor do campo deve ser maior que ${v}.`,
  url: "O campo deve ser uma URL válida.",
  precisao: "O valor do campo excede a precisão ou escala permitida.",
  dataFutura: "O campo não pode ser uma data futura.",
  enumInvalido: "O valor informado não é válido para este campo.",
  usuarioCaracteres: "Use apenas letras, números e - . _ @ +",
} as const;
