/**
 * EXAMPLE: How to integrate multi-language support into your components
 * 
 * This file demonstrates best practices for adding translations
 * Copy these patterns into your existing components
 */

import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import TranslatedText from './TranslatedText';
import SpeakButton from './SpeakButton';

// ============================================
// EXAMPLE 1: Simple Component with Static Text
// ============================================
export const SimpleExample = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard')}</h1>
      <p>{t('welcome')}</p>
      <button>{t('submit')}</button>
      <button>{t('cancel')}</button>
    </div>
  );
};

// ============================================
// EXAMPLE 2: Complaint Card with Dynamic Content
// ============================================
export const ComplaintCardExample = ({ complaint }) => {
  const { t } = useTranslation();
  
  return (
    <div className="complaint-card">
      {/* Static label */}
      <span className="label">{t('title')}:</span>
      
      {/* Dynamic content with TTS */}
      <h3>
        <TranslatedText text={complaint.title} />
        <SpeakButton text={complaint.title} />
      </h3>
      
      {/* Static label */}
      <span className="label">{t('description')}:</span>
      
      {/* Dynamic content with TTS */}
      <p>
        <TranslatedText text={complaint.description} />
        <SpeakButton text={complaint.description} />
      </p>
      
      {/* Static status translation */}
      <div className="status-badge">
        <span>{t('status')}: </span>
        <span className={`status-${complaint.status}`}>
          {t(complaint.status)}
        </span>
      </div>
      
      {/* Static priority translation */}
      <div className="priority-badge">
        <span>{t('priority')}: </span>
        <span className={`priority-${complaint.priority}`}>
          {t(complaint.priority)}
        </span>
      </div>
    </div>
  );
};

// ============================================
// EXAMPLE 3: Form with Translated Labels
// ============================================
export const FormExample = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: ''
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    alert(t('complaint_submitted'));
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>{t('complaint_title')}</label>
        <input
          type="text"
          placeholder={t('title')}
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
        />
      </div>
      
      <div className="form-group">
        <label>{t('complaint_description')}</label>
        <textarea
          placeholder={t('description')}
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>
      
      <div className="form-group">
        <label>{t('select_category')}</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
        >
          <option value="">{t('select_category')}</option>
          <option value="academic">{t('academic')}</option>
          <option value="infrastructure">{t('infrastructure')}</option>
          <option value="hostel">{t('hostel')}</option>
          <option value="transport">{t('transport')}</option>
          <option value="library">{t('library')}</option>
          <option value="canteen">{t('canteen')}</option>
          <option value="other">{t('other')}</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>{t('select_priority')}</label>
        <select
          value={formData.priority}
          onChange={(e) => setFormData({...formData, priority: e.target.value})}
        >
          <option value="">{t('select_priority')}</option>
          <option value="low">{t('low')}</option>
          <option value="medium">{t('medium')}</option>
          <option value="high">{t('high')}</option>
          <option value="urgent">{t('urgent')}</option>
        </select>
      </div>
      
      <div className="form-actions">
        <button type="submit">{t('submit_complaint')}</button>
        <button type="button">{t('cancel')}</button>
      </div>
    </form>
  );
};

// ============================================
// EXAMPLE 4: Dashboard with Statistics
// ============================================
export const DashboardStatsExample = ({ stats }) => {
  const { t } = useTranslation();
  
  return (
    <div className="stats-container">
      <div className="stat-card">
        <h3>{t('total_complaints')}</h3>
        <p className="stat-number">{stats.total}</p>
      </div>
      
      <div className="stat-card">
        <h3>{t('pending_complaints')}</h3>
        <p className="stat-number">{stats.pending}</p>
      </div>
      
      <div className="stat-card">
        <h3>{t('resolved_complaints')}</h3>
        <p className="stat-number">{stats.resolved}</p>
      </div>
    </div>
  );
};

// ============================================
// EXAMPLE 5: List with Search and Filter
// ============================================
export const ComplaintListExample = ({ complaints }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  return (
    <div className="complaint-list">
      <div className="filters">
        <input
          type="text"
          placeholder={t('search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">{t('filter')} {t('status')}</option>
          <option value="pending">{t('pending')}</option>
          <option value="in_progress">{t('in_progress')}</option>
          <option value="resolved">{t('resolved')}</option>
          <option value="rejected">{t('rejected')}</option>
        </select>
      </div>
      
      {complaints.length === 0 ? (
        <p className="no-data">{t('no_complaints')}</p>
      ) : (
        complaints.map(complaint => (
          <ComplaintCardExample key={complaint.id} complaint={complaint} />
        ))
      )}
    </div>
  );
};

// ============================================
// EXAMPLE 6: Admin Actions with Confirmation
// ============================================
export const AdminActionsExample = ({ complaint, onUpdate }) => {
  const { t } = useTranslation();
  const [newStatus, setNewStatus] = useState(complaint.status);
  
  const handleStatusUpdate = () => {
    if (window.confirm(t('update_status') + '?')) {
      onUpdate(complaint.id, { status: newStatus });
      alert(t('complaint_updated'));
    }
  };
  
  return (
    <div className="admin-actions">
      <h4>{t('update_status')}</h4>
      
      <select
        value={newStatus}
        onChange={(e) => setNewStatus(e.target.value)}
      >
        <option value="pending">{t('pending')}</option>
        <option value="in_progress">{t('in_progress')}</option>
        <option value="resolved">{t('resolved')}</option>
        <option value="rejected">{t('rejected')}</option>
      </select>
      
      <button onClick={handleStatusUpdate}>
        {t('save')}
      </button>
    </div>
  );
};

// ============================================
// EXAMPLE 7: Programmatic Translation
// ============================================
export const ProgrammaticTranslationExample = () => {
  const { translateDynamic, currentLanguage } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleTranslate = async () => {
    setLoading(true);
    try {
      const result = await translateDynamic(inputText);
      setTranslatedText(result);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter text to translate"
      />
      
      <button onClick={handleTranslate} disabled={loading}>
        {loading ? 'Translating...' : `Translate to ${currentLanguage}`}
      </button>
      
      {translatedText && (
        <div className="translation-result">
          <p>{translatedText}</p>
          <SpeakButton text={translatedText} />
        </div>
      )}
    </div>
  );
};

// ============================================
// EXAMPLE 8: Loading States
// ============================================
export const LoadingStateExample = ({ isLoading, data }) => {
  const { t } = useTranslation();
  
  if (isLoading) {
    return <div className="loading">{t('loading')}</div>;
  }
  
  if (!data) {
    return <div className="error">{t('error')}</div>;
  }
  
  return (
    <div className="content">
      <TranslatedText text={data.content} showLoading />
    </div>
  );
};

// ============================================
// USAGE INSTRUCTIONS
// ============================================
/*

TO INTEGRATE INTO YOUR COMPONENTS:

1. Import the translation hook:
   import { useTranslation } from '../hooks/useTranslation';

2. Import components for dynamic content:
   import TranslatedText from './TranslatedText';
   import SpeakButton from './SpeakButton';

3. Use in your component:
   const { t } = useTranslation();

4. Replace static text:
   <button>Submit</button>  →  <button>{t('submit')}</button>

5. Wrap dynamic content:
   <p>{complaint.description}</p>
   →
   <p>
     <TranslatedText text={complaint.description} />
     <SpeakButton text={complaint.description} />
   </p>

AVAILABLE TRANSLATION KEYS:
See src/utils/staticTranslations.js for all available keys

BEST PRACTICES:
- Use t() for UI labels and static text
- Use TranslatedText for user-generated content
- Add SpeakButton for accessibility
- Cache translations automatically handled
- Fallback to original text on error

*/
