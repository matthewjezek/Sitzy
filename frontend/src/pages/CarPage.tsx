import { useEffect, useRef } from 'react'
import RideStatus from '../components/RideStatus'
import { useNavigate } from 'react-router'
import { FiEdit, FiTrash, FiMapPin, FiCalendar, FiUsers } from 'react-icons/fi'
import { toast } from 'react-toastify'
import OverheadSvg from '../components/OverheadSvg'
import Loader from '../components/Loader'
import { SeatRenderer, type SeatData } from '../components/SeatRenderer'
import { DeleteDialog, InviteDialog } from '../components/Dialog'
import { useInvites } from "../hooks/useInvites"
import { useCar } from "../hooks/useCar";

export default function CarPage() {
  const navigate = useNavigate()
  const dialogRef1 = useRef<HTMLDialogElement | null>(null)
  const dialogRef2 = useRef<HTMLDialogElement | null>(null)
  
  const { car, loading, error, notFound, fetchMyCar, deleteCar } = useCar()
  const { 
    invites, 
    createInvite, 
    cancelInvite, 
    loading: invitesLoading, 
    error: inviteError 
  } = useInvites(car?.id)

  useEffect(() => {
    fetchMyCar()
  }, [fetchMyCar])

  if (loading && !notFound) {
    return <Loader />
  }

  if (error) {
    return <div className="text-red-500 text-center mt-4">{error}</div>
  }

  if (notFound) {
    return (
      <div className='page-container'>
        <div className="card">
          <div className="w-full rounded-t-3xl h-60 flex items-center overflow-hidden">
            <OverheadSvg />
          </div>
          <div className="p-4">
            <h2 className="text-xl font-semibold">Kam pojedeme?</h2>
            <p className="text-gray-600">Přijměte pozvánku nebo naplánujte vlastní jízdu.</p>
            <div className="flex justify-between items-center mt-4">
              <button className="primary-button" onClick={() => navigate('/create-car')}>
                Naplánovat jízdu
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!car) {
    return null
  }

  function toggleDialog(which: 1 | 2) {
    const ref = which === 1 ? dialogRef1 : dialogRef2;
    if (!ref.current) return;
    if (ref.current.hasAttribute('open')) {
      ref.current.close();
    } else {
      ref.current.showModal();
    }
  }

  async function handleDeleteCar() {
    try {
      if (!car) return;
      const success = await deleteCar(car.id)
      if (success) {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Chyba při mazání auta:', err)
      toast.error('Nepodařilo se smazat auto.')
    } finally {
      toggleDialog(1)
    }
  }

  return (
    <div className="flex items-center justify-center p-6">
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-5xl">
        {/* Levý panel */}
        <div className="bg-gray-100 rounded-3xl shadow-xl border border-indigo-100 lg:w-3/5 overflow-hidden flex flex-col">
          {/* Header s gradientem */}
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{car.name}</h1>
                <div className="flex items-center gap-2 text-indigo-100">
                  <FiUsers size={16} />
                  <span className="text-sm">Jízda pro {car.seats?.length || 0} pasažérů</span>
                </div>
              </div>
              <div className="bg-white/20 rounded-2xl p-3">
                <FiMapPin size={24} className="text-white" />
              </div>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="relative bg-gradient-to-br from-indigo-50 to-blue-50 min-h-[400px] lg:flex-1 lg:min-h-0 border-b border-indigo-100 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="bg-indigo-500 rounded-full p-4 inline-block">
                  <FiMapPin size={32} className="text-white" />
                </div>
                <div>
                  <p className="text-indigo-700 font-medium">Mapa trasy</p>
                  <p className="text-indigo-500 text-sm">Brzy dostupné</p>
                </div>
              </div>
            </div>
          </div>

          {/* Datum a status */}
          <div className="p-6 space-y-4 flex-shrink-0">
            <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
              <div className="flex flex-col items-center sm:items-start gap-3">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3">
                  <div className="bg-indigo-500 rounded-xl p-2">
                    <FiCalendar size={20} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-indigo-900 mb-1">Datum jízdy</h3>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="">
                    {car.date && !isNaN(new Date(car.date).getTime()) ? (
                      <div>
                        <div className="text-4xl font-bold text-indigo-900">
                          {new Date(car.date).toLocaleString('cs-CZ', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-lg text-indigo-600 mt-1">
                          {new Date(car.date).toLocaleDateString('cs-CZ', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                          })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-indigo-700">Neznámé datum</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-center sm:text-left">
                <RideStatus date={car.date} />
              </div>
            </div>

            {/* Akční tlačítka */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => toggleDialog(2)}
                className="col-span-3 sm:grow-4 primary-button"
              >
                <FiUsers size={18} />
                Pozvat řidiče
              </button>

              <button
                onClick={() => navigate('/edit-car')}
                className="col-span-3 sm:grow-2 secondary-button"
              >
                <FiEdit size={20} />
              </button>
              
              <button
                onClick={() => toggleDialog(1)}
                className="bg-red-50 hover:bg-red-100 border-2 border-red-200 hover:border-red-300 text-red-600 p-3 rounded-2xl transition-all duration-200 transform hover:scale-105 cursor-pointer flex items-center justify-center group col-span-3 sm:grow-2"
              >
                <FiTrash size={20} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Pravý panel */}
        <div className="bg-gray-100 rounded-3xl shadow-lg border border-gray-200 lg:w-2/5 flex-1 flex items-center justify-center p-4">
          <SeatRenderer
            layout={car.layout || 'Neznámé rozložení'}
            seats={
              car.seats?.map((seat: SeatData, idx: number) => ({
                position: seat.position ?? idx + 1,
                user_name: seat.user_name ?? '',
                occupied: !!seat.user_name,
              })) ?? []
            }
            ownerName={car.owner_id || 'Neznámý řidič'}
            mode="display"
          />
        </div>
      </div>

      {/* Dialog mimo layout */}
      <DeleteDialog toggle={() => toggleDialog(1)} ref={dialogRef1} action={handleDeleteCar}>
        <span className="dialog-title">Smazat auto</span>
        <p className="dialog-message">
          Opravdu chcete smazat toto auto? Společně s ním bude smazána i jízda. Tato akce je nevratná.
        </p>
      </DeleteDialog>
      <InviteDialog
        toggle={() => toggleDialog(2)}
        ref={dialogRef2}
        pendingInvites={invites}
        onInvite={createInvite}
        onCancel={cancelInvite}
        loading={invitesLoading}
        error={inviteError}
      />
    </div>
  )
}