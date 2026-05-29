// Offline tickets storage utility
// Caches booking data including QR codes for offline access

export interface OfflineTicket {
  id: string;
  movieId: string;
  movieTitle: string;
  moviePosterUrl: string;
  cinemaName: string;
  cinemaAddress: string;
  sessionDate: string;
  sessionTime: string;
  hallName: string;
  seats?: string[]; // For level 1 (seat selection)
  tickets?: {
    adult: number;
    child: number;
    senior: number;
  }; // For level 2 (general admission)
  totalPrice: number;
  bookingDate: string;
  qrCode: string; // Base64 encoded QR code
  bookingType: 'seat-selection' | 'general-admission' | 'phone-booking';
  integrationLevel: 1 | 2 | 3;
}

const STORAGE_KEY = 'seatify_offline_tickets';

/**
 * Generate a simple QR code data URL
 * In production, you would use a real QR code library
 */
export const generateQRCode = (data: string): string => {
  // For now, return a placeholder. In production, use a library like 'qrcode'
  // This creates a simple data URL that represents the booking
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Simple visual representation
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#000000';
    
    // Create a simple pattern
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        if ((i + j + data.length) % 2 === 0) {
          ctx.fillRect(i * 20, j * 20, 20, 20);
        }
      }
    }
  }
  
  return canvas.toDataURL('image/png');
};

/**
 * Save a ticket to offline storage
 */
export const saveOfflineTicket = (ticket: OfflineTicket): void => {
  try {
    const tickets = getOfflineTickets();
    tickets.push(ticket);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (error) {
    console.error('Failed to save offline ticket:', error);
  }
};

/**
 * Get all offline tickets
 */
export const getOfflineTickets = (): OfflineTicket[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load offline tickets:', error);
    return [];
  }
};

/**
 * Get a specific offline ticket by ID
 */
export const getOfflineTicketById = (id: string): OfflineTicket | null => {
  const tickets = getOfflineTickets();
  return tickets.find(t => t.id === id) || null;
};

/**
 * Delete an offline ticket
 */
export const deleteOfflineTicket = (id: string): void => {
  try {
    const tickets = getOfflineTickets();
    const filtered = tickets.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete offline ticket:', error);
  }
};

/**
 * Check if offline tickets are available
 */
export const hasOfflineTickets = (): boolean => {
  return getOfflineTickets().length > 0;
};

/**
 * Get storage info
 */
export const getStorageInfo = (): { used: number; available: boolean } => {
  try {
    const tickets = getOfflineTickets();
    const used = new Blob([JSON.stringify(tickets)]).size;
    return { used, available: true };
  } catch {
    return { used: 0, available: false };
  }
};
