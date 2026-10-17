import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { editProfileSchema, EditProfileInput } from '@/lib/schemas/zodSchemas';
import { useAuthStore, User } from '@/store/authStore';

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const [skillsInput, setSkillsInput] = useState('');

  const defaultValues: EditProfileInput = {
    fullName: user?.fullName || '',
    phone: user?.phone || null,
    companyName: user?.companyName || null,
    portfolioUrl: user?.portfolioUrl || null,
    bio: user?.bio || null,
    experienceYears: user?.experienceYears || null,
    skills: user?.skills || [],
    locationAddress: user?.locationAddress || null,
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues,
  });

  const currentSkills = watch('skills') || [];

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName,
        phone: user.phone ?? null,
        companyName: user.companyName ?? null,
        portfolioUrl: user.portfolioUrl ?? null,
        bio: user.bio ?? null,
        experienceYears: user.experienceYears ?? null,
        skills: user.skills || [],
        locationAddress: user.locationAddress ?? null,
      });
    }
  }, [user, reset]);

  const addSkill = () => {
    const trimmed = skillsInput.trim();
    if (trimmed && !currentSkills.includes(trimmed)) {
      setValue('skills', [...currentSkills, trimmed], { shouldDirty: true });
      setSkillsInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setValue(
      'skills',
      currentSkills.filter((s: string) => s !== skill),
      { shouldDirty: true }
    );
  };

  const onSubmit = async (data: EditProfileInput) => {
    try {
      const payload: EditProfileInput = { ...data };
      if (payload.experienceYears === null) delete payload.experienceYears;
      await updateProfile(payload);
      toast.success('Perfil actualizado exitosamente');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al actualizar perfil');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Mi perfil</h1>
        <p className="text-ink-soft mt-1">Actualiza tu información personal y profesional</p>
      </div>

      <div className="card">
        <div className="mb-6 flex items-center gap-4 border-b border-line pb-6">
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-primary-500 text-3xl font-semibold text-white">
            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
          </span>
          <div>
            <h2 className="text-xl font-semibold text-ink">{user?.fullName || 'Usuario'}</h2>
            <p className="text-muted">{user?.email}</p>
            {!user?.emailVerified && (
              <span className="badge-yellow mt-1 inline-block">
                Email no verificado
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre completo *</label>
              <input
                type="text"
                {...register('fullName')}
                className="input"
              />
              {errors.fullName && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.fullName.message}</p>
              )}
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input
                type="tel"
                {...register('phone')}
                className="input"
                placeholder="+54 9 11 1234-5678"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Empresa / Organización</label>
              <input
                type="text"
                {...register('companyName')}
                className="input"
                placeholder="Nombre de tu empresa"
              />
            </div>
            <div>
              <label className="label">Años de experiencia</label>
              <input
                type="number"
                min="0"
                {...register('experienceYears', { valueAsNumber: true })}
                className="input"
                placeholder="5"
              />
              {errors.experienceYears && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.experienceYears.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="label">URL Portfolio / Web</label>
            <input
              type="url"
              {...register('portfolioUrl')}
              className="input"
              placeholder="https://mi-portfolio.com"
            />
          </div>

          <div>
            <label className="label">Bio / Sobre mí</label>
            <textarea
              {...register('bio')}
              rows={4}
              className="input resize-none"
              placeholder="Cuéntanos sobre ti, tu experiencia y qué te hace único/a diferente..."
            />
          </div>

          <div>
            <label className="label">Habilidades</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                className="input flex-1"
                placeholder="Ej: React, Node.js, Diseño UI... (Enter para agregar)"
              />
              <button type="button" onClick={addSkill} className="btn-secondary">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentSkills.length === 0 ? (
                <p className="text-sm text-muted">Aún no has agregado habilidades</p>
              ) : (
                currentSkills.map((skill: string, i: number) => (
                  <span
                    key={i}
                    className="badge-blue py-1"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      aria-label={`Quitar ${skill}`}
                      className="ml-1 rounded text-ink-soft transition-colors hover:text-red-600 dark:hover:text-red-400"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="label">Ubicación</label>
            <input
              type="text"
              {...register('locationAddress')}
              className="input"
              placeholder="Ciudad / País o zona (Ej: Buenos Aires, Argentina)"
            />
          </div>

          <div className="border-t border-line pt-4">
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full sm:w-auto">
              <Save className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
