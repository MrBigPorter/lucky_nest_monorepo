
import React, { useState } from 'react';
import { FileText, HelpCircle, Plus, Edit2, Trash2, Globe, Eye } from 'lucide-react';
import { Card, Button, Input, Modal, Badge, Select } from '../components/UIComponents';
import { MOCK_ARTICLES, MOCK_FAQS } from '../constants';
import { useMockData } from '../hooks/useMockData';
import { Article, Faq } from '../types';

const ArticleManager: React.FC = () => {
    const { data: articles, add, update, remove } = useMockData<Article>(MOCK_ARTICLES);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Article>>({});

    const handleSave = () => {
        if (formData.id) {
            update(formData.id, formData);
        } else {
            add({ 
                ...formData, 
                id: Date.now().toString(),
                status: 'published',
                publishDate: new Date().toISOString().split('T')[0],
                views: 0
            } as Article);
        }
        setIsModalOpen(false);
    };

    const openModal = (article?: Article) => {
        setFormData(article || { title: '', category: 'news', author: 'admin' });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-4">
             <div className="flex justify-end">
                <Button onClick={() => openModal()}><Plus size={16}/> Publish Article</Button>
             </div>
             <Card>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-white/5 text-gray-400 text-xs font-semibold uppercase">
                            <th className="pb-4 pl-4">Title</th>
                            <th className="pb-4">Category</th>
                            <th className="pb-4">Status</th>
                            <th className="pb-4">Date</th>
                            <th className="pb-4">Views</th>
                            <th className="pb-4 text-right pr-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {articles.map(a => (
                            <tr key={a.id} className="group hover:bg-gray-50 dark:hover:bg-white/5">
                                <td className="py-4 pl-4 font-medium text-gray-900 dark:text-white max-w-xs truncate">{a.title}</td>
                                <td className="py-4"><Badge color="blue">{a.category}</Badge></td>
                                <td className="py-4"><Badge color={a.status === 'published' ? 'green' : 'yellow'}>{a.status}</Badge></td>
                                <td className="py-4 text-sm text-gray-500">{a.publishDate}</td>
                                <td className="py-4 text-sm text-gray-500 flex items-center gap-1"><Eye size={14}/> {a.views}</td>
                                <td className="py-4 text-right pr-6 flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => openModal(a)}><Edit2 size={16}/></Button>
                                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => remove(a.id)}><Trash2 size={16}/></Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </Card>

             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Article Editor" size="lg">
                 <div className="space-y-4">
                     <Input label="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                     <div className="grid grid-cols-2 gap-4">
                        <Select 
                            label="Category"
                            value={formData.category}
                            onChange={e => setFormData({...formData, category: e.target.value as any})}
                            options={[{label: 'Announcement', value: 'announcement'}, {label: 'Guide', value: 'guide'}, {label: 'News', value: 'news'}]}
                        />
                        <Select 
                            label="Status"
                            value={formData.status}
                            onChange={e => setFormData({...formData, status: e.target.value as any})}
                            options={[{label: 'Published', value: 'published'}, {label: 'Draft', value: 'draft'}]}
                        />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content</label>
                         <textarea 
                            className="w-full h-48 px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white resize-none"
                            placeholder="Type your content here (Rich Text Editor placeholder)..."
                         ></textarea>
                     </div>
                     <div className="flex justify-end gap-2 pt-4">
                         <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                         <Button onClick={handleSave}>Publish</Button>
                     </div>
                 </div>
             </Modal>
        </div>
    );
};

const FaqManager: React.FC = () => {
    const { data: faqs, add, update, remove } = useMockData<Faq>(MOCK_FAQS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Faq>>({});

    const handleSave = () => {
        if (formData.id) {
            update(formData.id, formData);
        } else {
            add({ ...formData, id: Date.now().toString(), sortOrder: faqs.length + 1 } as Faq);
        }
        setIsModalOpen(false);
    };

    const openModal = (faq?: Faq) => {
        setFormData(faq || { question: '', answer: '', category: 'general' });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-4">
             <div className="flex justify-end">
                <Button onClick={() => openModal()}><Plus size={16}/> Add Question</Button>
             </div>
             <div className="grid grid-cols-1 gap-4">
                 {faqs.map(faq => (
                     <div key={faq.id} className="p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 flex justify-between items-start group hover:border-primary-500/30 transition-all">
                         <div>
                             <div className="flex items-center gap-2 mb-1">
                                 <Badge color="gray">{faq.category}</Badge>
                                 <h4 className="font-bold text-gray-900 dark:text-white">{faq.question}</h4>
                             </div>
                             <p className="text-gray-500 text-sm">{faq.answer}</p>
                         </div>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="ghost" onClick={() => openModal(faq)}><Edit2 size={16}/></Button>
                            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => remove(faq.id)}><Trash2 size={16}/></Button>
                         </div>
                     </div>
                 ))}
             </div>

             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="FAQ Editor">
                 <div className="space-y-4">
                     <Input label="Question" value={formData.question} onChange={e => setFormData({...formData, question: e.target.value})} />
                     <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Answer</label>
                         <textarea 
                            className="w-full h-24 px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white resize-none"
                            value={formData.answer}
                            onChange={e => setFormData({...formData, answer: e.target.value})}
                         ></textarea>
                     </div>
                     <Input label="Category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g. general, finance" />
                     <div className="flex justify-end gap-2 pt-4">
                         <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                         <Button onClick={handleSave}>Save</Button>
                     </div>
                 </div>
             </Modal>
        </div>
    );
};

export const ContentCMS: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'articles' | 'faqs'>('articles');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content CMS</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage announcements, news, and help center</p>
            </div>

            <div className="flex border-b border-gray-200 dark:border-white/10">
                <button 
                    onClick={() => setActiveTab('articles')}
                    className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-all ${activeTab === 'articles' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                    <FileText size={16}/> Articles & News
                </button>
                <button 
                    onClick={() => setActiveTab('faqs')}
                    className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-all ${activeTab === 'faqs' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                    <HelpCircle size={16}/> FAQs
                </button>
            </div>

            <div className="min-h-[500px]">
                {activeTab === 'articles' && <ArticleManager />}
                {activeTab === 'faqs' && <FaqManager />}
            </div>
        </div>
    );
};
