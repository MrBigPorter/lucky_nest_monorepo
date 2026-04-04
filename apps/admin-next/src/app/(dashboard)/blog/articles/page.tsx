'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  User,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { PageHeader } from '@/components/scaffold/PageHeader';
import { Card, Badge } from '@/components/UIComponents';

export default function ArticlesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Mock data
  const articles = [
    {
      id: '1',
      title: 'Next.js 15 New Features Explained',
      slug: 'nextjs-15-new-features',
      status: 'PUBLISHED',
      author: 'Admin',
      category: 'Technology',
      tags: ['Next.js', 'React'],
      views: 1250,
      comments: 24,
      publishedAt: '2026-04-01',
      readTime: '8 min',
    },
    {
      id: '2',
      title: 'TypeScript Advanced Type Techniques',
      slug: 'typescript-advanced-type-tricks',
      status: 'PUBLISHED',
      author: 'Admin',
      category: 'Technology',
      tags: ['TypeScript', 'JavaScript'],
      views: 890,
      comments: 18,
      publishedAt: '2026-03-28',
      readTime: '12 min',
    },
    {
      id: '3',
      title: 'Tailwind CSS v4 Usage Guide',
      slug: 'tailwind-css-v4-guide',
      status: 'DRAFT',
      author: 'Admin',
      category: 'Technology',
      tags: ['CSS', 'Tailwind'],
      views: 0,
      comments: 0,
      publishedAt: null,
      readTime: '6 min',
    },
    {
      id: '4',
      title: 'Database Optimization Practices',
      slug: 'database-optimization-practices',
      status: 'PUBLISHED',
      author: 'Admin',
      category: 'Database',
      tags: ['PostgreSQL', 'Performance'],
      views: 560,
      comments: 12,
      publishedAt: '2026-03-25',
      readTime: '15 min',
    },
    {
      id: '5',
      title: 'Microservices Architecture Design',
      slug: 'microservices-architecture-design',
      status: 'SCHEDULED',
      author: 'Admin',
      category: 'Architecture',
      tags: ['Microservices', 'Architecture'],
      views: 0,
      comments: 0,
      publishedAt: '2026-04-10',
      readTime: '20 min',
    },
    {
      id: '6',
      title: 'React Server Components Deep Dive',
      slug: 'react-server-components-deep-dive',
      status: 'PUBLISHED',
      author: 'Admin',
      category: 'Technology',
      tags: ['React', 'Next.js'],
      views: 320,
      comments: 8,
      publishedAt: '2026-03-20',
      readTime: '10 min',
    },
    {
      id: '7',
      title: 'GraphQL vs REST API Comparison',
      slug: 'graphql-vs-rest-api-comparison',
      status: 'DRAFT',
      author: 'Admin',
      category: 'API',
      tags: ['GraphQL', 'REST'],
      views: 0,
      comments: 0,
      publishedAt: null,
      readTime: '14 min',
    },
    {
      id: '8',
      title: 'Docker Container Best Practices',
      slug: 'docker-container-best-practices',
      status: 'PUBLISHED',
      author: 'Admin',
      category: 'DevOps',
      tags: ['Docker', 'Containers'],
      views: 420,
      comments: 15,
      publishedAt: '2026-03-15',
      readTime: '11 min',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge color="green">Published</Badge>;
      case 'DRAFT':
        return <Badge color="gray">Draft</Badge>;
      case 'SCHEDULED':
        return <Badge color="blue">Scheduled</Badge>;
      default:
        return <Badge color="gray">{status}</Badge>;
    }
  };

  const filteredArticles = articles.filter((article) => {
    if (search && !article.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && article.status !== statusFilter) {
      return false;
    }
    if (categoryFilter !== 'all' && article.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  const categories = Array.from(new Set(articles.map((a) => a.category)));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Article Management"
        description="Manage blog articles including creation, editing, publishing, and deletion"
        buttonText="New Article"
        buttonOnClick={() => {
          window.location.href = '/dashboard/blog/articles/create';
        }}
        buttonPrefixIcon={<Plus size={18} />}
      />

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search article titles or content..."
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-black/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <button className="px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <button className="px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </Card>

      {/* Articles Table */}
      <Card title={`Article List (${filteredArticles.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Article
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Category
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tags
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Metrics
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Published
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map((article) => (
                <tr
                  key={article.id}
                  className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {article.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        /{article.slug}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <User className="h-3 w-3 mr-1" />
                          {article.author}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="h-3 w-3 mr-1" />
                          {article.readTime}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(article.status)}
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300">
                      {article.category}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-600 dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Eye className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {article.views.toLocaleString()}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 ml-1">
                          views
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MessageSquare className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {article.comments}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 ml-1">
                          comments
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {article.publishedAt || (
                        <span className="text-gray-400 dark:text-gray-500">
                          Not published
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/blog/articles/${article.slug}`}
                        target="_blank"
                        className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-700 dark:text-gray-300"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Link>
                      <Link
                        href={`/blog/articles/${article.id}/edit`}
                        className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-700 dark:text-gray-300"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                      <button className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors text-red-600 dark:text-red-400">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing 1 to {filteredArticles.length} of {filteredArticles.length}{' '}
            entries
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="px-3 py-1.5 text-sm rounded-lg border border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400">
              1
            </button>
            <button className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              2
            </button>
            <button className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              3
            </button>
            <button className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Articles
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {articles.length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-500/10">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Published Articles
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {articles.filter((a) => a.status === 'PUBLISHED').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-500/10">
              <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Views
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {articles.reduce((sum, a) => sum + a.views, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-500/10">
              <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
