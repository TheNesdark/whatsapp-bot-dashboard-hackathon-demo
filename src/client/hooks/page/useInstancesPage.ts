import { ChangeEvent, FormEvent, useState } from 'react';
import { useInstances } from '@/hooks';
import { createInstanceFormSchema } from '@/schemas/instances';
import type { CreateInstanceFormValues, CreateInstanceInput } from '@/types';

const EMPTY_FIELDS: CreateInstanceFormValues = {
  name: '',
  phone: '',
  apiUrl: '',
};

function mapCreateInstanceFormToInput(values: CreateInstanceFormValues): CreateInstanceInput {
  return {
    name: values.name,
    phoneNumberId: values.phone,
    apiUrl: values.apiUrl || undefined,
  };
}

export function useInstancesPage() {
  const { instances, loading, error, createInstance, deleteInstance } = useInstances();
  const [showCreate, setShowCreate] = useState(false);

  return {
    instances,
    loading,
    error,
    createInstance,
    deleteInstance,
    showCreate,
    openCreateModal: () => setShowCreate(true),
    closeCreateModal: () => setShowCreate(false),
  };
}

export function useCreateInstanceForm(
  onCreate: (input: CreateInstanceInput) => Promise<unknown>,
  onClose: () => void
) {
  const [fields, setFields] = useState<CreateInstanceFormValues>(EMPTY_FIELDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (key: keyof CreateInstanceFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setFields((currentFields) => ({ ...currentFields, [key]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = createInstanceFormSchema.safeParse(fields);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Formulario invalido');
      return;
    }

    setLoading(true);
    setError(null);
    await onCreate(mapCreateInstanceFormToInput(result.data));
    setLoading(false);
    onClose();
  };

  return {
    fields,
    loading,
    error,
    setField,
    handleSubmit,
  };
}
