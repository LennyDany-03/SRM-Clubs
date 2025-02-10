// src/utils/eventService.js
import { supabase } from '../config/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export const createEvent = async (formData) => {
  try {
    // 1. Upload image first
    let imageUrl = null;
    if (formData.image) {
      imageUrl = await uploadEventImage(formData.image);
    }

    // 2. Format the date
    const formattedDate = new Date(formData.date);
    const month = formattedDate.toLocaleString('default', { month: 'short' });
    const day = formattedDate.getDate();
    const year = formattedDate.getFullYear();
    const displayDate = `${month} ${day}, ${year}`;

    // 3. Create event object
    const eventData = {
      id: uuidv4(),
      title: formData.title,
      club: formData.club,
      date: displayDate,
      time: formData.time,
      location: formData.location,
      description: formData.description,
      image: imageUrl || '/api/placeholder/360/640',
      created_at: new Date().toISOString()
    };

    // 4. Insert into Supabase
    const { data, error } = await supabase
      .from('events')
      .insert([eventData]);

    if (error) throw error;
    return { data, error: null };

  } catch (error) {
    console.error('Error in createEvent:', error);
    return { data: null, error };
  }
};

const uploadEventImage = async (file) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `event-images/${fileName}`;

    const { data, error } = await supabase.storage
      .from('events')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('events')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// src/pages/CreateNewEvent.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Upload } from 'lucide-react';
import { createEvent } from '../utils/eventService';

const CreateNewEvent = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    club: '',
    date: '',
    time: '',
    location: '',
    description: '',
    image: null
  });

  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await createEvent(formData);
      
      if (error) throw error;

      // Clear form
      setFormData({
        title: '',
        club: '',
        date: '',
        time: '',
        location: '',
        description: '',
        image: null
      });
      setPreviewUrl(null);

      // Navigate to events page
      navigate('/events');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Rest of your component JSX remains the same...
  // Just update the submit button to show loading state:
  
  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-8">
      {/* Your existing JSX... */}
      
      {error && (
        <div className="text-red-500 mb-4 text-center">
          {error}
        </div>
      )}

      {/* Update your submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-[20px] 
          hover:from-blue-600 hover:to-purple-700 transition-all duration-300 
          shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)]
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Creating Event...' : 'Create Event'}
      </button>
    </div>
  );
};

export default CreateNewEvent;