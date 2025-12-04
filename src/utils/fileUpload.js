import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

/**
 * Upload a file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} bucket - The storage bucket name (default: 'receipts')
 * @param {string} folder - Optional folder path within the bucket
 * @returns {Promise<{data: object, error: object}>}
 */
export const uploadFile = async (file, bucket = 'receipts', folder = 'receipts') => {
    try {
        if (!file) {
            return { data: null, error: { message: 'No file provided' } }
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${uuidv4()}.${fileExt}`
        const filePath = folder ? `${folder}/${fileName}` : fileName

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            console.error('Upload error:', error)
            return { data: null, error }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath)

        return {
            data: {
                path: data.path,
                publicUrl,
                fileName,
                fullPath: filePath
            },
            error: null
        }
    } catch (err) {
        console.error('Upload exception:', err)
        return { data: null, error: err }
    }
}

/**
 * Upload multiple files to Supabase Storage
 * @param {FileList|File[]} files - The files to upload
 * @param {string} bucket - The storage bucket name
 * @param {string} folder - Optional folder path within the bucket
 * @returns {Promise<{data: object[], errors: object[]}>}
 */
export const uploadMultipleFiles = async (files, bucket = 'receipts', folder = 'receipts') => {
    const uploadPromises = Array.from(files).map(file => uploadFile(file, bucket, folder))
    const results = await Promise.all(uploadPromises)

    const data = results.filter(r => r.data).map(r => r.data)
    const errors = results.filter(r => r.error).map(r => r.error)

    return { data, errors }
}

/**
 * Delete a file from Supabase Storage
 * @param {string} filePath - The path of the file to delete
 * @param {string} bucket - The storage bucket name
 * @returns {Promise<{data: object, error: object}>}
 */
export const deleteFile = async (filePath, bucket = 'receipts') => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .remove([filePath])

    return { data, error }
}
