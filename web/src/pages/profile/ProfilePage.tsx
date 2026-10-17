import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
    locationLat: user?.locationLat ?? null,
    locationLng: user?.locationLng ?? null,
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
        locationLat: user.locationLat ?? null,
        locationLng: user.locationLng ?? null,
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
        <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
        <p className="text-gray-600 mt-1">Actualiza tu información personal y profesional</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 pb-6 mb-6 border-b border-gray-100">
          <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user?.fullName || 'Usuario'}</h2>
            <p className="text-gray-500">{user?.email}</p>
            {!user?.emailVerified && (
              <span className="badge-yellow mt-1 inline-block">
                ⚠️ Email no verificado
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
                <p className="text-red-600 text-sm mt-1">{errors.fullName.message}</p>
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
                <p className="text-red-600 text-sm mt-1">{errors.experienceYears.message}</p>
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
                  Agregar
                </button>
              </div>
            <div className="flex flex-wrap gap-2">
              {currentSkills.length === 0 ? (
                <p className="text-sm text-gray-500">Aún no has agregado habilidades</p>
              ) : (
                currentSkills.map((skill: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 badge-blue py-1"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:text-red-600 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="label">Ubicación - Dirección</label>
            <input
              type="text"
              {...register('locationAddress')}
              className="input"
              placeholder="Dirección completa"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Latitud</label>
              <input
                type="number"
                step="any"
                {...register('locationLat', { valueAsNumber: true })}
                className="input"
                placeholder="-34.6037"
              />
            </div>
            <div>
              <label className="label">Longitud</label>
              <input
                type="number"
                step="any"
                {...register('locationLng', { valueAsNumber: true })}
                className="input"
                placeholder="-58.3816"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full sm:w-auto">
              {isSubmitting ? 'Guardando...' : '💾 Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
