import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  User,
  Calendar,
  Building,
  ArrowRight,
  ArrowLeft,
  Send,
  Save
} from 'lucide-react';
import { IntakeForm } from '../types';
import { useDocuments } from '../hooks/useDocuments';

export const IntakeForms: React.FC = () => {
  const { intakeForms, addIntakeForm, isLoading } = useDocuments();
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState<Partial<IntakeForm>>({
    formType: 'incoming',
    documentType: '',
    sender: '',
    recipient: '',
    subject: '',
    description: '',
    priority: 'medium',
    department: '',
    attachments: [],
    status: 'draft',
    submittedBy: 'Current User'
  });

  const getStatusIcon = (status: IntakeForm['status']) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-4 h-4 text-gray-500" />;
      case 'submitted':
        return <Send className="w-4 h-4 text-blue-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-orange-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: IntakeForm['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: IntakeForm['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.subject && formData.description && formData.department) {
      addIntakeForm({
        ...formData,
        status: 'submitted'
      } as Omit<IntakeForm, 'id' | 'trackingId' | 'submittedDate'>);
      setShowNewForm(false);
      setFormData({
        formType: 'incoming',
        documentType: '',
        sender: '',
        recipient: '',
        subject: '',
        description: '',
        priority: 'medium',
        department: '',
        attachments: [],
        status: 'draft',
        submittedBy: 'Current User'
      });
    }
  };

  const handleSaveDraft = () => {
    if (formData.subject) {
      addIntakeForm({
        ...formData,
        status: 'draft'
      } as Omit<IntakeForm, 'id' | 'trackingId' | 'submittedDate'>);
      setShowNewForm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Digital Intake Forms</h2>
            <p className="text-gray-600">Create and manage document intake forms for streamlined processing</p>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Intake Form</span>
          </button>
        </div>
      </div>

      {/* Form Type Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg w-fit">
          <button className="px-4 py-2 bg-white text-gray-900 rounded-md shadow-sm font-medium">
            All Forms
          </button>
          <button className="px-4 py-2 text-gray-600 hover:text-gray-900 rounded-md">
            Incoming
          </button>
          <button className="px-4 py-2 text-gray-600 hover:text-gray-900 rounded-md">
            Outgoing
          </button>
          <button className="px-4 py-2 text-gray-600 hover:text-gray-900 rounded-md">
            Drafts
          </button>
        </div>
      </div>

      {/* Intake Forms List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Intake Forms</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {intakeForms.map((form) => (
            <div key={form.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                    {form.formType === 'incoming' ? (
                      <ArrowRight className="w-6 h-6 text-white" />
                    ) : (
                      <ArrowLeft className="w-6 h-6 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{form.subject}</h3>
                      {getStatusIcon(form.status)}
                      <span className="text-sm text-gray-500">ID: {form.trackingId}</span>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <span className="font-medium capitalize">{form.formType}</span>
                        <span>•</span>
                        <span>{form.documentType}</span>
                      </div>
                      {form.sender && (
                        <div className="flex items-center space-x-1">
                          <span>From: {form.sender}</span>
                        </div>
                      )}
                      {form.recipient && (
                        <div className="flex items-center space-x-1">
                          <span>To: {form.recipient}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Building className="w-4 h-4" />
                        <span>{form.department}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">{form.description}</p>

                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(form.status)}`}>
                        {form.status}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(form.priority)}`}>
                        {form.priority} priority
                      </span>
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>Submitted by {form.submittedBy}</span>
                      </div>
                      {form.submittedDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{form.submittedDate.toLocaleDateString()}</span>
                        </div>
                      )}
                      {form.dueDate && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Due: {form.dueDate.toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                    View
                  </button>
                  <button className="px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Form Modal */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Create New Intake Form</h3>
                <button
                  onClick={() => setShowNewForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Form Type</label>
                  <select
                    value={formData.formType}
                    onChange={(e) => setFormData({ ...formData, formType: e.target.value as 'incoming' | 'outgoing' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="incoming">Incoming Document</option>
                    <option value="outgoing">Outgoing Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                  <select
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select document type</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Contract">Contract</option>
                    <option value="Report">Report</option>
                    <option value="Correspondence">Correspondence</option>
                    <option value="Legal Document">Legal Document</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {formData.formType === 'incoming' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sender</label>
                    <input
                      type="text"
                      value={formData.sender}
                      onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter sender name or organization"
                    />
                  </div>
                )}

                {formData.formType === 'outgoing' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recipient</label>
                    <input
                      type="text"
                      value={formData.recipient}
                      onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter recipient name or organization"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select department</option>
                    <option value="Finance">Finance</option>
                    <option value="HR">HR</option>
                    <option value="Legal">Legal</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Facilities">Facilities</option>
                    <option value="IT">IT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as IntakeForm['priority'] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.dueDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value ? new Date(e.target.value) : undefined })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter document subject or title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide detailed description of the document and any special handling instructions"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Draft</span>
                </button>
                
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Form</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};