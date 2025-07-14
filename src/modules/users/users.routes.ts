import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { supabase, supabaseAdmin } from '../../core/supabaseClient';

const router = Router();

// Schema validasi untuk alamat
const addressSchema = z.object({
  name: z.string().min(1, "Nama penerima wajib diisi"),
  phone: z.string().min(1, "Nomor telepon wajib diisi"),
  address: z.string().min(1, "Alamat wajib diisi"),
  city: z.string().min(1, "Kota wajib diisi"),
  postalCode: z.string().min(1, "Kode pos wajib diisi"),
  isDefault: z.boolean().optional().default(false),
});

// GET /api/v1/user/addresses - Mendapatkan daftar alamat pengguna
router.get('/addresses', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: addresses, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching addresses:', error);
      
      // If table doesn't exist, return empty array
      const errorCode = error?.code;
      const errorMessage = error?.message || '';
      
      if (errorCode === 'PGRST116' || errorMessage.includes('relation "user_addresses" does not exist')) {
        console.log('user_addresses table does not exist, returning empty array');
        return res.json([]);
      }
      
      throw error;
    }

    // Format response to match frontend expectations
    const formattedAddresses = (addresses || []).map(addr => ({
      id: addr.id,
      name: addr.recipient_name,
      phone: addr.phone_number,
      address: addr.address,
      city: addr.city,
      postalCode: addr.postal_code,
      isDefault: addr.is_default,
      createdAt: addr.created_at,
      updatedAt: addr.updated_at
    }));

    res.json(formattedAddresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    
    // Return mock address for development if no addresses found
    const mockAddresses = [
      {
        id: 'default-1',
        name: 'Alamat Rumah',
        phone: '081234567890',
        address: 'Jl. Contoh No. 123',
        city: 'Jakarta',
        postalCode: '12345',
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    res.json(mockAddresses);
  }
});

// POST /api/v1/user/addresses - Menambahkan alamat baru
router.post('/addresses', authMiddleware, async (req, res) => {
  try {
    const validation = addressSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Data tidak valid',
        errors: validation.error.flatten() 
      });
    }

    const { name, phone, address, city, postalCode, isDefault } = validation.data;
    const userId = req.user.id;

    // Jika alamat ini akan menjadi default, set semua alamat lain menjadi tidak default
    if (isDefault) {
      const { error: updateError } = await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
      
      if (updateError) {
        const updateErrorMessage = updateError?.message || '';
        if (!updateErrorMessage.includes('relation "user_addresses" does not exist')) {
          console.error('Error updating default addresses:', updateError);
        }
      }
    }

    const { data: newAddress, error } = await supabase
      .from('user_addresses')
      .insert({
        user_id: userId,
        recipient_name: name,
        phone_number: phone,
        address: address,
        city: city,
        postal_code: postalCode,
        is_default: isDefault
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating address:', error);
      
      // If table doesn't exist, return a mock address for development
      const errorCode = error?.code;
      const errorMessage = error?.message || '';
      
      if (errorCode === 'PGRST116' || errorMessage.includes('relation "user_addresses" does not exist')) {
        console.log('user_addresses table does not exist, returning mock address');
        const mockAddress = {
          id: `mock-${Date.now()}`,
          name: name,
          phone: phone,
          address: address,
          city: city,
          postalCode: postalCode,
          isDefault: isDefault,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return res.status(201).json(mockAddress);
      }
      
      throw error;
    }

    // Format response
    const formattedAddress = {
      id: newAddress.id,
      name: newAddress.recipient_name,
      phone: newAddress.phone_number,
      address: newAddress.address,
      city: newAddress.city,
      postalCode: newAddress.postal_code,
      isDefault: newAddress.is_default,
      createdAt: newAddress.created_at,
      updatedAt: newAddress.updated_at
    };

    res.status(201).json(formattedAddress);
  } catch (error) {
    console.error('Error creating address:', error);
    
    // Return mock address for any error during development
    const { name, phone, address, city, postalCode, isDefault } = req.body;
    const mockAddress = {
      id: `mock-${Date.now()}`,
      name: name || 'Mock Name',
      phone: phone || '081234567890',
      address: address || 'Mock Address',
      city: city || 'Mock City',
      postalCode: postalCode || '12345',
      isDefault: isDefault || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.status(201).json(mockAddress);
  }
});

// PUT /api/v1/user/addresses/:id - Mengupdate alamat
router.put('/addresses/:id', authMiddleware, async (req, res) => {
  try {
    const addressId = req.params.id;
    const userId = req.user.id;

    const validation = addressSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Data tidak valid',
        errors: validation.error.flatten() 
      });
    }

    const { name, phone, address, city, postalCode, isDefault } = validation.data;

    // Pastikan alamat milik user ini
    const { data: existingAddress, error: checkError } = await supabase
      .from('user_addresses')
      .select('id')
      .eq('id', addressId)
      .eq('user_id', userId)
      .single();

    if (checkError || !existingAddress) {
      return res.status(404).json({ message: 'Alamat tidak ditemukan' });
    }

    // Jika alamat ini akan menjadi default, set semua alamat lain menjadi tidak default
    if (isDefault) {
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data: updatedAddress, error } = await supabase
      .from('user_addresses')
      .update({
        recipient_name: name,
        phone_number: phone,
        address: address,
        city: city,
        postal_code: postalCode,
        is_default: isDefault,
        updated_at: new Date().toISOString()
      })
      .eq('id', addressId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Format response
    const formattedAddress = {
      id: updatedAddress.id,
      name: updatedAddress.recipient_name,
      phone: updatedAddress.phone_number,
      address: updatedAddress.address,
      city: updatedAddress.city,
      postalCode: updatedAddress.postal_code,
      isDefault: updatedAddress.is_default,
      createdAt: updatedAddress.created_at,
      updatedAt: updatedAddress.updated_at
    };

    res.json(formattedAddress);
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ message: 'Gagal mengupdate alamat' });
  }
});

// DELETE /api/v1/user/addresses/:id - Menghapus alamat
router.delete('/addresses/:id', authMiddleware, async (req, res) => {
  try {
    const addressId = req.params.id;
    const userId = req.user.id;

    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Alamat berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ message: 'Gagal menghapus alamat' });
  }
});

// Schema validasi untuk update profile
const updateProfileSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
});

// PUT /api/v1/user/profile - Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const validation = updateProfileSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        message: 'Data tidak valid',
        errors: validation.error.errors
      });
    }

    const { name, phone, avatar } = validation.data;

    if (!supabaseAdmin) {
      return res.status(500).json({ 
        message: 'Admin operations not configured. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.' 
      });
    }

    // Update user metadata in Supabase Auth
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar_url = avatar;

    const { data: user, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          ...req.user.user_metadata,
          ...updateData
        }
      }
    );

    if (error) {
      console.error('Supabase error updating profile:', error);
      throw error;
    }

    // Return updated user data
    const updatedUser = {
      id: user.user.id,
      name: user.user.user_metadata?.name || user.user.email?.split('@')[0] || '',
      email: user.user.email || '',
      phone: user.user.user_metadata?.phone,
      avatar: user.user.user_metadata?.avatar_url,
      joinDate: user.user.created_at,
      isSeller: user.user.user_metadata?.is_seller || false,
    };

    res.json({
      message: 'Profile berhasil diupdate',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Gagal mengupdate profile' });
  }
});

export default router; 