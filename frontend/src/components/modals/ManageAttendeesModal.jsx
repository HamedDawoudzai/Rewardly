import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared'
import { Users, X, Trash2, AlertCircle, Loader2, Search, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react'
import { eventAPI } from '@/api/events'

const ITEMS_PER_PAGE = 5

const ManageAttendeesModal = ({ eventId, eventName, onClose, onUpdated }) => {
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(null)
  const [adding, setAdding] = useState(false)
  const [event, setEvent] = useState(null)
  const [guests, setGuests] = useState([])
  
  // Toast notifications
  const [toast, setToast] = useState(null)
  
  // Add attendee form
  const [addUtorid, setAddUtorid] = useState('')
  
  // Remove section search and pagination
  const [removeSearchTerm, setRemoveSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Active tab
  const [activeTab, setActiveTab] = useState('add')

  useEffect(() => {
    loadEvent()
  }, [eventId])

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [removeSearchTerm])

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = useCallback((message, type) => {
    console.log('Showing toast:', message, type) // Debug log
    setToast({ message, type, key: Date.now() })
  }, [])

  const loadEvent = async () => {
    setLoading(true)
    try {
      const eventData = await eventAPI.getById(eventId)
      console.log('Loaded event data:', eventData) // Debug log
      setEvent(eventData)
      setGuests(eventData.guests || [])
    } catch (err) {
      console.error('Failed to load event:', err)
      showToast('Failed to load event attendees. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddGuest = async (e) => {
    e.preventDefault()
    const trimmedUtorid = addUtorid.trim()
    
    if (!trimmedUtorid) {
      showToast('Please enter a UTORid', 'error')
      return
    }

    // Basic UTORid validation
    if (trimmedUtorid.length < 3) {
      showToast('UTORid must be at least 3 characters', 'error')
      return
    }

    setAdding(true)

    try {
      const result = await eventAPI.addGuest(eventId, trimmedUtorid)
      
      // Check if the response indicates success
      if (result && result.ok !== false) {
        setAddUtorid('')
        // Reload event to get updated guest list
        await loadEvent()
        // Notify parent component to refresh
        if (onUpdated) {
          onUpdated()
        }
      } else {
        // This shouldn't happen since errors are thrown, but just in case
        showToast(result?.message || 'Failed to add guest', 'error')
      }
    } catch (err) {
      console.error('Failed to add guest:', err)
      // Parse error message for user-friendly display
      const errorMessage = parseErrorMessage(err, 'add', trimmedUtorid)
      showToast(errorMessage, 'error')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveGuest = async (userId, guestName) => {
    setRemoving(userId)

    try {
      const result = await eventAPI.removeGuest(eventId, userId)
      
      // Check if the response indicates success
      if (result && result.ok !== false) {
        // Reload event to get updated guest list
        await loadEvent()
        // Notify parent component to refresh
        if (onUpdated) {
          onUpdated()
        }
      } else {
        showToast(result?.message || 'Failed to remove guest', 'error')
      }
    } catch (err) {
      console.error('Failed to remove guest:', err)
      const errorMessage = parseErrorMessage(err, 'remove', guestName)
      showToast(errorMessage, 'error')
    } finally {
      setRemoving(null)
    }
  }

  // Parse error messages for user-friendly display
  const parseErrorMessage = (err, action, identifier) => {
    // Handle the error object structure from apiFetch
    const message = err?.message || err?.data?.error || err?.error || ''
    
    console.log('Parsing error:', err, 'message:', message) // Debug log
    
    // Check for common error patterns
    if (message.toLowerCase().includes('not found')) {
      if (action === 'add') {
        return `User "${identifier}" was not found. Please check the UTORid and try again.`
      }
      return `Could not find attendee to remove. They may have already been removed.`
    }
    
    if (message.toLowerCase().includes('already registered') || message.toLowerCase().includes('already a guest')) {
      return `${identifier} is already registered for this event.`
    }
    
    if (message.toLowerCase().includes('already an organizer')) {
      return `${identifier} is an organizer of this event and cannot be added as a guest.`
    }
    
    if (message.toLowerCase().includes('event has ended')) {
      return 'This event has already ended. You cannot modify attendees.'
    }
    
    if (message.toLowerCase().includes('event is full')) {
      return 'This event is at full capacity. No more attendees can be added.'
    }
    
    if (message.toLowerCase().includes('not authorized')) {
      return 'You do not have permission to modify attendees for this event.'
    }

    if (message.toLowerCase().includes('unique constraint') || message.toLowerCase().includes('prisma')) {
      if (action === 'add') {
        return `${identifier} is already registered for this event.`
      }
      return 'An error occurred. Please try again.'
    }
    
    // Default error message
    if (message) {
      return message
    }
    
    if (action === 'add') {
      return `Failed to add ${identifier}. Please try again.`
    }
    return `Failed to remove ${identifier}. Please try again.`
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Filter guests based on search term
  const filteredGuests = guests.filter(guest => {
    if (!removeSearchTerm.trim()) return true
    const search = removeSearchTerm.toLowerCase()
    const name = (guest.name || '').toLowerCase()
    const utorid = (guest.utorid || guest.username || '').toLowerCase()
    return name.includes(search) || utorid.includes(search)
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredGuests.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedGuests = filteredGuests.slice(startIndex, endIndex)

  // Ensure current page is valid after filtering
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [filteredGuests.length, totalPages, currentPage])

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Manage Attendees</h2>
              <p className="text-sm text-gray-500 mt-1">{eventName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b px-6">
            <button
              onClick={() => setActiveTab('add')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'add'
                  ? 'border-rewardly-blue text-rewardly-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserPlus className="h-4 w-4 inline-block mr-2" />
              Add Attendees
            </button>
            <button
              onClick={() => setActiveTab('remove')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'remove'
                  ? 'border-rewardly-blue text-rewardly-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Trash2 className="h-4 w-4 inline-block mr-2" />
              Remove Attendees
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-rewardly-blue" />
              </div>
            ) : !event ? (
              <div className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600">Failed to load event. Please close and try again.</p>
              </div>
            ) : (
              <>
                {/* Event Summary */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-2 text-sm flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Attendees:</span>
                    <span className="font-semibold text-gray-900">{guests.length}</span>
                  </div>
                  {event.capacity && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-semibold text-gray-900">
                        {guests.length} / {event.capacity}
                        {guests.length >= event.capacity && (
                          <span className="ml-2 text-orange-600 text-xs">(Full)</span>
                        )}
                      </span>
                    </div>
                  )}
                  {event.startsAt || event.startTime ? (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Event Date:</span>
                      <span className="font-semibold text-gray-900">
                        {formatDateTime(event.startsAt || event.startTime)}
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Add Attendees Tab */}
                {activeTab === 'add' && (
                  <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Add Guest Form */}
                    <form onSubmit={handleAddGuest} className="mb-4 flex-shrink-0">
                      <div className="flex gap-3">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={addUtorid}
                            onChange={(e) => setAddUtorid(e.target.value)}
                            placeholder="Enter UTORid to add (e.g., johndoe1)..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent text-sm"
                            disabled={adding}
                          />
                        </div>
                        <Button type="submit" disabled={adding || !addUtorid.trim()}>
                          {adding ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Enter a user's UTORid to add them as an attendee. The user must already have an account.
                      </p>
                    </form>

                    {/* Current Attendees Preview */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Current Attendees ({guests.length})</h4>
                      {guests.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border rounded-lg">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No attendees yet</p>
                          <p className="text-xs text-gray-400 mt-1">Add someone using the form above</p>
                        </div>
                      ) : (
                        <div className="divide-y border rounded-lg max-h-[200px] overflow-y-auto">
                          {guests.map((guest) => (
                            <div key={guest.id} className="p-3 flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-rewardly-light-blue flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-medium text-rewardly-blue">
                                  {(guest.name || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{guest.name || 'Unknown'}</p>
                                <p className="text-xs text-gray-500 truncate">@{guest.utorid || guest.username || 'N/A'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Remove Attendees Tab */}
                {activeTab === 'remove' && (
                  <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Search Bar */}
                    <div className="mb-4 flex-shrink-0">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={removeSearchTerm}
                          onChange={(e) => setRemoveSearchTerm(e.target.value)}
                          placeholder="Search by name or UTORid..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rewardly-blue focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    {/* Guest List Header */}
                    <div className="flex items-center justify-between mb-3 flex-shrink-0">
                      <h3 className="text-sm font-medium text-gray-700">
                        Attendees ({filteredGuests.length}{removeSearchTerm && ` of ${guests.length}`})
                      </h3>
                    </div>

                    {/* Guest List - Scrollable */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                      {guests.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border rounded-lg">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No attendees to remove</p>
                          <p className="text-xs text-gray-400 mt-1">Add attendees first using the "Add Attendees" tab</p>
                        </div>
                      ) : filteredGuests.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border rounded-lg">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No matches found</p>
                          <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                        </div>
                      ) : (
                        <div className="divide-y border rounded-lg">
                          {paginatedGuests.map((guest) => (
                            <div
                              key={guest.id}
                              className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="h-8 w-8 rounded-full bg-rewardly-light-blue flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-medium text-rewardly-blue">
                                    {(guest.name || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900 truncate">{guest.name || 'Unknown'}</p>
                                  <p className="text-sm text-gray-500 truncate">@{guest.utorid || guest.username || 'N/A'}</p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveGuest(guest.id, guest.name || guest.utorid)}
                                disabled={removing === guest.id}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 ml-3 flex-shrink-0"
                              >
                                {removing === guest.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Removing...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove
                                  </>
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t mt-4 flex-shrink-0">
                        <p className="text-sm text-gray-500">
                          Showing {startIndex + 1}-{Math.min(endIndex, filteredGuests.length)} of {filteredGuests.length}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm text-gray-600 px-2">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
            <Button variant="outline" onClick={onClose} disabled={loading || removing || adding}>
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Global styles for toast animation */}
      <style>{`
        @keyframes toastSlideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>

      {/* Error Toast Notification - Rendered via Portal to document body */}
      {toast && createPortal(
        <div 
          key={toast.key}
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            animation: 'toastSlideUp 0.3s ease-out'
          }}
          className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium max-w-md">{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            className="ml-2 hover:bg-white/20 rounded p-1 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}

export default ManageAttendeesModal
