
import React, { useState } from 'react';
import { MessageSquare, Search, Filter, Clock, CheckCircle, AlertCircle, Send, User, ChevronLeft } from 'lucide-react';
import { Card, Button, Input, Select, Badge, Textarea, Modal } from '../components/UIComponents';
import { MOCK_WORK_ORDERS } from '../constants';
import { useMockData } from '../hooks/useMockData';
import { WorkOrder } from '../types';

export const ServiceCenter: React.FC = () => {
  const { data: tickets, update } = useMockData<WorkOrder>(MOCK_WORK_ORDERS);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<WorkOrder | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Quick Replies
  const quickReplies = [
      "Hi there! Could you please provide your transaction ID so we can check?",
      "We have processed your request. Please check your balance in 10-15 minutes.",
      "To upgrade your VIP level, you need to reach the accumulated deposit threshold.",
      "Thank you for your feedback. We have forwarded this to our technical team.",
      "Please provide a screenshot of the error you are encountering."
  ];

  const filteredTickets = tickets.filter(t => 
    (filterStatus === 'all' || t.status === filterStatus) &&
    (t.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) || t.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleReply = () => {
    if (!selectedTicket || !replyMessage) return;
    
    const newReply = {
      sender: 'support' as const,
      message: replyMessage,
      time: new Date().toLocaleString()
    };

    const updatedTicket = {
      ...selectedTicket,
      status: 'pending' as const, // Waiting for user response
      replies: [...selectedTicket.replies, newReply]
    };

    update(selectedTicket.id, updatedTicket);
    setSelectedTicket(updatedTicket);
    setReplyMessage('');
  };

  const handleCloseTicket = () => {
    if (!selectedTicket) return;
    update(selectedTicket.id, { status: 'closed' });
    setSelectedTicket(null);
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      default: return 'blue';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Service Center</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage support tickets and customer inquiries</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
        {/* List View */}
        <Card className={`w-full lg:w-1/3 flex flex-col p-0 overflow-hidden border border-gray-200 dark:border-white/5 ${selectedTicket ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 dark:border-white/5 space-y-3 bg-gray-50/50 dark:bg-white/5">
             <div className="flex items-center bg-white dark:bg-black/20 p-2 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm focus-within:ring-2 focus-within:ring-primary-500/50 transition-all">
                <Search size={16} className="text-gray-400 ml-2" />
                <input 
                  type="text" 
                  placeholder="Search tickets..." 
                  className="bg-transparent border-none outline-none flex-1 ml-2 text-sm text-gray-700 dark:text-white placeholder-gray-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {['all', 'open', 'pending', 'resolved', 'closed'].map(s => (
                   <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${filterStatus === s ? 'bg-primary-500 text-white shadow-md' : 'bg-gray-100 dark:bg-white/10 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/20'}`}
                   >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                   </button>
                ))}
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
             {filteredTickets.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                     <MessageSquare size={40} className="mb-2 opacity-20"/>
                     <p className="text-sm">No tickets found</p>
                 </div>
             ) : (
                 filteredTickets.map(ticket => (
                    <div 
                       key={ticket.id}
                       onClick={() => setSelectedTicket(ticket)}
                       className={`p-4 border-b border-gray-100 dark:border-white/5 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5 group relative ${selectedTicket?.id === ticket.id ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}
                    >
                       {selectedTicket?.id === ticket.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500"></div>}
                       <div className="flex justify-between items-start mb-1.5">
                          <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 dark:text-white text-sm">{ticket.user.name}</span>
                              {ticket.priority === 'high' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                          </div>
                          <span className="text-[10px] text-gray-400">{ticket.createdAt.split(' ')[0]}</span>
                       </div>
                       <h4 className="font-medium text-gray-700 dark:text-gray-300 text-xs mb-1 truncate">{ticket.subject}</h4>
                       <p className="text-xs text-gray-400 truncate mb-2">{ticket.message}</p>
                       <div className="flex items-center gap-2 mt-2">
                          <Badge color={ticket.status === 'open' ? 'red' : ticket.status === 'closed' ? 'gray' : 'green'}>{ticket.status}</Badge>
                          <span className="text-[10px] text-gray-400 font-mono">#{ticket.ticketNo}</span>
                       </div>
                    </div>
                 ))
             )}
          </div>
        </Card>

        {/* Chat Detail View */}
        <div className={`flex-1 flex flex-col overflow-hidden bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-white/5 ${selectedTicket ? 'flex' : 'hidden lg:flex'}`}>
           {selectedTicket ? (
              <>
                 {/* Header */}
                 <div className="p-4 bg-white dark:bg-dark-800 border-b border-gray-100 dark:border-white/5 flex justify-between items-center shadow-sm z-10">
                    <div className="flex items-center gap-3">
                       <button onClick={() => setSelectedTicket(null)} className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full">
                           <ChevronLeft size={20} />
                       </button>
                       <img src={selectedTicket.user.avatar} className="w-10 h-10 rounded-full bg-gray-100" />
                       <div>
                          <h2 className="font-bold text-gray-900 dark:text-white text-sm lg:text-base">{selectedTicket.subject}</h2>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                             <span>#{selectedTicket.ticketNo}</span>
                             <span>•</span>
                             <span>{selectedTicket.user.name}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge color={selectedTicket.status === 'open' ? 'red' : 'green'}>{selectedTicket.status}</Badge>
                        <Button variant="outline" size="sm" onClick={handleCloseTicket} className="hidden sm:flex">Close</Button>
                    </div>
                 </div>

                 {/* Messages Area */}
                 <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 bg-gray-50/50 dark:bg-black/20">
                    {/* User Original Message */}
                    <div className="flex gap-3 max-w-[85%]">
                       <img src={selectedTicket.user.avatar} className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
                       <div>
                          <div className="flex items-baseline gap-2 mb-1">
                             <span className="font-bold text-gray-900 dark:text-white text-xs">{selectedTicket.user.name}</span>
                             <span className="text-[10px] text-gray-400">{selectedTicket.createdAt}</span>
                          </div>
                          <div className="p-3.5 bg-white dark:bg-dark-800 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-200 text-sm leading-relaxed">
                             {selectedTicket.message}
                          </div>
                       </div>
                    </div>

                    {/* Thread */}
                    {selectedTicket.replies.map((reply, idx) => (
                       <div key={idx} className={`flex gap-3 max-w-[85%] ${reply.sender === 'support' ? 'ml-auto flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${reply.sender === 'support' ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white' : 'bg-gray-200'}`}>
                             {reply.sender === 'support' ? <MessageSquare size={14} /> : <User size={14} />}
                          </div>
                          <div className={`${reply.sender === 'support' ? 'text-right' : ''}`}>
                             <div className={`flex items-baseline gap-2 mb-1 ${reply.sender === 'support' ? 'flex-row-reverse' : ''}`}>
                                <span className="font-bold text-gray-900 dark:text-white text-xs">{reply.sender === 'support' ? 'You' : selectedTicket.user.name}</span>
                                <span className="text-[10px] text-gray-400">{reply.time}</span>
                             </div>
                             <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm text-left ${reply.sender === 'support' ? 'bg-primary-500 text-white rounded-tr-none' : 'bg-white dark:bg-dark-800 border border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-200 rounded-tl-none'}`}>
                                {reply.message}
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>

                 {/* Input Area */}
                 <div className="p-4 bg-white dark:bg-dark-800 border-t border-gray-100 dark:border-white/5">
                    {selectedTicket.status !== 'closed' ? (
                        <>
                            <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar mb-1">
                                {quickReplies.map((qr, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setReplyMessage(qr)}
                                        className="whitespace-nowrap px-3 py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-xs text-gray-600 dark:text-gray-300 transition-colors border border-transparent hover:border-gray-300 dark:hover:border-white/20"
                                    >
                                        {qr.substring(0, 30)}...
                                    </button>
                                ))}
                            </div>
                            <div className="relative flex gap-3 items-end">
                                <Textarea 
                                    placeholder="Type your reply here..." 
                                    className="min-h-[50px] max-h-[150px] py-3 pr-12 resize-none"
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                />
                                <Button 
                                    className="h-[46px] w-[46px] rounded-xl flex items-center justify-center p-0 flex-shrink-0 mb-[1px]"
                                    onClick={handleReply}
                                    disabled={!replyMessage.trim()}
                                >
                                    <Send size={20} />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-4 text-gray-400 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 border-dashed">
                            This ticket is closed. Re-open to send a message.
                        </div>
                    )}
                 </div>
              </>
           ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 dark:bg-black/20">
                 <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare size={32} className="opacity-50 text-gray-500" />
                 </div>
                 <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Select a Conversation</h3>
                 <p className="text-sm max-w-xs text-center mt-2">Choose a ticket from the left sidebar to view details and reply.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
