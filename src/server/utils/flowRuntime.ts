import { FlowVariableType } from '@shared/flow';
import type { ButtonsNodeData, MenuNodeData, QuestionNodeData } from '@shared/flow';
import type { UserState } from '@server/types/whatsapp';

const DOCUMENT_REGEX = /^\d{5,12}$/;
const PHONE_REGEX = /^\d{7,15}$/;
const NUMBER_REGEX = /^\d+$/;
const NAME_REGEX = /^\p{L}[\p{L}\s]{2,50}$/u;

export function normalizeDigitsInput(value: string): string {
  return value.replace(/[^\d]/g, '');
}

export function normalizeInteractiveInput(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

export function replaceVariables(text: string, variables: Record<string, any>): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return variables[trimmedKey] !== undefined ? String(variables[trimmedKey]) : '';
  });
}

export function sanitizeInput(value: string): string {
  return value.replace(/\{\{|\}\}/g, '').trim();
}

export function validateQuestionValue(data: QuestionNodeData, value: string): string | null {
  const cleaned = normalizeDigitsInput(value);
  const sanitized = sanitizeInput(value);
  
  switch (data.validation) {
    case 'document':
      return DOCUMENT_REGEX.test(cleaned)
        ? null
        : 'Documento inválido. Debe tener entre 5 y 12 dígitos (solo números):';
    case 'phone':
      return PHONE_REGEX.test(cleaned)
        ? null
        : 'Teléfono inválido. Debe tener entre 7 y 15 dígitos (solo números):';
    case 'number':
      return NUMBER_REGEX.test(cleaned)
        ? null
        : 'Por favor ingresa solo números:';
    case 'text':
    default:
      if (data.variable === 'name' || data.variable === 'full_name') {
        return sanitized.length >= 3 && NAME_REGEX.test(sanitized)
          ? null
          : 'Por favor ingresa un nombre válido (mínimo 3 letras, sin números ni símbolos):';
      }

      return sanitized.length >= 2
        ? null
        : 'Por favor ingresa un valor válido (mínimo 2 caracteres):';
  }
}

export function buildInteractiveList(menu: Pick<MenuNodeData, 'title' | 'options'>) {
  return {
    text: menu.title,
    buttonText: 'Ver opciones',
    sections: [
      {
        title: 'Opciones',
        rows: menu.options.map((option) => ({
          id: option.label,
          title: option.label.substring(0, 24),
        })),
      },
    ],
  };
}

export function findInteractiveOptionByInput<
  T extends { id: string; label: string },
>(options: T[], input: string): T | undefined {
  const normalizedInput = normalizeInteractiveInput(input);

  return options.find((option) =>
    option.id === input ||
    normalizeInteractiveInput(option.id) === normalizedInput ||
    normalizeInteractiveInput(option.label) === normalizedInput,
  );
}

export function assignNodeSelectionValue(
  state: UserState,
  nodeId: string,
  variable: string | undefined,
  selected: string,
): void {
  if (variable) {
    state.variables[variable] = selected;
  }
}
