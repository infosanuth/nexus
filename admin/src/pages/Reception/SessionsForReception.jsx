import React, { useContext, useEffect, useRef, useState } from 'react'
import { CalendarDays, Search, X, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { ReceptionContext } from '../../context/ReceptionContext'

const convertTo12Hour = (time24) => {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
}

const formatSessionDate = (date) => {
  const d = new Date(date)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

const todayUTC = () => {
  const now = new Date()
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
}

const dateInputToUTC = (val) => {
  const [y, m, d] = val.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

const QUICK_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Upcoming', value: 'upcoming' },
]

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Cancelled', value: 'cancelled' },
]

const StatusBadge = ({ item, isPast }) => {
  const isFull = item.bookedPatientsCount >= item.maxPatients
  if (item.status === 'cancelled')
    return <span className='inline-flex items-center justify-self-start px-1 py-px rounded-full text-[11px] font-medium bg-red-50 text-red-500 border border-red-200'>Cancelled</span>
  if (isPast)
    return <span className='inline-flex items-center justify-self-start px-1 py-px rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200'>Past</span>
  if (isFull)
    return <span className='inline-flex items-center justify-self-start px-1 py-px rounded-full text-[11px] font-medium bg-orange-50 text-orange-500 border border-orange-200'>Full</span>
  return <span className='inline-flex items-center justify-self-start px-1 py-px rounded-full text-[11px] font-medium bg-blue-50 text-blue-500 border border-blue-200'>Active</span>
}


const SessionsForReception = () => {

  const { rToken, sessions, getSessions } = useContext(ReceptionContext)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [specificDate, setSpecificDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10
  const dateInputRef = useRef(null)

  useEffect(() => {
    if (rToken) getSessions()
  }, [rToken])

  const today = todayUTC()

  const handleQuickPill = (value) => {
    setDateFilter(value)
    setSpecificDate('')
    setPage(1)
  }

  const handleDateInput = (e) => {
    setSpecificDate(e.target.value)
    setDateFilter('all')
    setPage(1)
  }

  const clearSpecificDate = () => {
    setSpecificDate('')
    if (dateInputRef.current) dateInputRef.current.value = ''
    setPage(1)
  }

  const isFiltered = search.trim() || dateFilter !== 'all' || specificDate || statusFilter !== 'all'

  const resetFilters = () => {
    setSearch('')
    setDateFilter('all')
    setSpecificDate('')
    setStatusFilter('all')
    setPage(1)
    if (dateInputRef.current) dateInputRef.current.value = ''
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await getSessions()
    setRefreshing(false)
  }

  useEffect(() => { setPage(1) }, [search, statusFilter])

  const filtered = sessions.filter((s) => {
    const sessionDay = new Date(s.date).setUTCHours(0, 0, 0, 0)
    const isPast = sessionDay < today
    const isFull = s.bookedPatientsCount >= s.maxPatients

    if (search.trim() && !s.doctorName.toLowerCase().includes(search.trim().toLowerCase())) return false

    if (specificDate) {
      if (sessionDay !== dateInputToUTC(specificDate)) return false
    } else {
      if (dateFilter === 'today' && sessionDay !== today) return false
      if (dateFilter === 'upcoming' && sessionDay < today) return false
    }

    if (statusFilter === 'cancelled' && s.status !== 'cancelled') return false
    if (statusFilter === 'available' && (isFull || s.status === 'cancelled')) return false

    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className='flex flex-col w-full max-w-6xl gap-4 m-5'>

      {/* Header */}
      <div className='flex items-center gap-3'>
        <h1 className='text-xl font-semibold text-gray-800'>Doctor Sessions</h1>
        <span className='text-xs font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full'>
          {filtered.length} {filtered.length === 1 ? 'session' : 'sessions'}
        </span>
      </div>

      {/* Filter bar */}
      <div className='flex flex-wrap items-center px-5 py-3 bg-white border border-gray-200 shadow-sm rounded-xl gap-x-3 gap-y-3'>

        {/* Search */}
        <div className='relative w-96 shrink-0'>
          <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-3 top-1/2' />
          <input
            type='text'
            placeholder='Search doctor...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full py-2 pl-8 pr-8 text-sm transition-colors border border-gray-200 rounded-lg focus:outline-none focus:border-primary'
          />
          {search && (
            <button onClick={() => setSearch('')} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors'>
              <X size={13} />
            </button>
          )}
        </div>

        <div className='hidden w-px h-5 bg-gray-200 lg:block' />

        {/* Date pills + calendar */}
        <div className='flex items-center gap-1.5'>
          <span className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1'>Date</span>
          {QUICK_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleQuickPill(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                !specificDate && dateFilter === opt.value
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}

          {/* Calendar icon button */}
          <div className='relative flex items-center ml-0.5'>
            <button
              type='button'
              onClick={() => dateInputRef.current?.showPicker()}
              title='Pick a specific date'
              className={`p-1.5 rounded-lg border transition-colors ${
                specificDate
                  ? 'border-primary/30 text-primary bg-primary/10'
                  : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
              }`}
            >
              <CalendarDays size={14} />
            </button>
            <input
              ref={dateInputRef}
              type='date'
              value={specificDate}
              onChange={handleDateInput}
              className='absolute w-0 h-0 opacity-0 pointer-events-none'
            />
            {specificDate && (
              <span className='ml-2 flex items-center gap-1 text-xs text-primary border border-primary/30 bg-primary/10 rounded-lg px-2.5 py-1 font-medium'>
                {new Date(specificDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                <button onClick={clearSpecificDate} className='transition-colors hover:text-red-400'>
                  <X size={11} />
                </button>
              </span>
            )}
          </div>
        </div>

        <div className='hidden w-px h-5 bg-gray-200 lg:block' />

        {/* Status pills */}
        <div className='flex items-center gap-1.5'>
          <span className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1'>Status</span>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === opt.value
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Refresh + Clear — pushed to the right */}
        <div className='flex items-center gap-3 ml-auto'>
          {isFiltered && (
            <button
              onClick={resetFilters}
              className='flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-red-400'
            >
              <X size={12} /> Clear
            </button>
          )}
          <button
            onClick={handleRefresh}
            title='Refresh'
            className='flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-primary hover:text-primary transition-colors'
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className='overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl'>

        {/* Table header */}
        <div className='max-sm:hidden grid grid-cols-[0.4fr_2fr_2fr_2fr_1.5fr_1fr] gap-2 py-3 px-6 bg-gray-50 border-b border-gray-200'>
          <p className='text-xs font-semibold tracking-wide text-gray-400 uppercase'>#</p>
          <p className='text-xs font-semibold tracking-wide text-gray-400 uppercase'>Doctor</p>
          <p className='text-xs font-semibold tracking-wide text-gray-400 uppercase text-center'>Date</p>
          <p className='text-xs font-semibold tracking-wide text-gray-400 uppercase text-center'>Time</p>
          <p className='text-xs font-semibold tracking-wide text-gray-400 uppercase text-center'>Slots</p>
          <p className='text-xs font-semibold tracking-wide text-gray-400 uppercase text-center'>Status</p>
        </div>

        <div>
          {filtered.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-3 py-16 text-gray-400'>
              <CalendarDays size={36} className='text-gray-200' />
              <p className='text-sm'>No sessions found</p>
              {isFiltered && (
                <button onClick={resetFilters} className='text-xs underline text-primary'>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            paginated.map((item, index) => {
              const sessionDay = new Date(item.date).setUTCHours(0, 0, 0, 0)
              const isPast = sessionDay < today
              const rowNumber = (safePage - 1) * PAGE_SIZE + index + 1

              return (
                <div
                  key={item._id}
                  className='max-sm:flex max-sm:flex-col max-sm:gap-1 sm:grid grid-cols-[0.4fr_2fr_2fr_2fr_1.5fr_1fr] gap-2 items-center py-3.5 px-6 border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0'
                >
                  <p className='text-xs text-gray-300 max-sm:hidden'>{rowNumber}</p>
                  <p className='text-sm font-medium text-gray-700'>{item.doctorName}</p>
                  <p className='text-sm text-gray-500 text-center'>{formatSessionDate(item.date)}</p>
                  <p className='text-sm text-gray-500 text-center'>
                    {convertTo12Hour(item.startTime)}
                    {item.endTime ? <><br /><span className='text-xs text-gray-400'>{convertTo12Hour(item.endTime)}</span></> : ''}
                  </p>
                  <p className='text-sm text-gray-500 tabular-nums text-center'>{item.bookedPatientsCount}<span className='text-gray-300 mx-0.5'>/</span>{item.maxPatients}</p>
                  <div className='flex justify-center'>
                    <StatusBadge item={item} isPast={isPast} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className='flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50'>
            <p className='text-xs text-gray-400'>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className='flex items-center gap-1'>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className='w-7 h-7 rounded border border-gray-200 text-gray-500 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center'
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('…')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '…' ? (
                    <span key={`ellipsis-${i}`} className='px-1 text-xs text-gray-400'>…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${
                        safePage === p
                          ? 'bg-primary text-white border-primary'
                          : 'border-gray-200 text-gray-500 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className='w-7 h-7 rounded border border-gray-200 text-gray-500 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center'
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SessionsForReception
