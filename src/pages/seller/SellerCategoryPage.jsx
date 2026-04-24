import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { ApiError } from '../../api/client';
import PageContainer from '../../components/common/PageContainer';
import { useAuth } from '../../features/auth/useAuth';
import {
  createCategorySellerApi,
  deleteCategoryApi,
  getCategoriesApi,
  updateCategorySellerApi,
} from '../../features/product/productApi';

function getCategoryPath(categories, categoryId) {
  const map = new Map(categories.map((c) => [c.id, c]));
  const parts = [];
  let current = map.get(categoryId);
  while (current) {
    parts.unshift(current.name);
    current = current.parentId ? map.get(current.parentId) : null;
  }
  return parts.join(' > ');
}

function CategoryTreeNode({ node, depth = 0 }) {
  const indent = depth * 16;
  return (
    <>
      <div className="flex items-center gap-2 py-1.5" style={{ paddingLeft: `${8 + indent}px` }}>
        {depth > 0 && <span className="text-gray-300 select-none text-xs">└</span>}
        <span className="text-sm text-gray-600">{node.name}</span>
        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">
          depth {node.depth}
        </span>
      </div>
      {node.children.map((child) => (
        <CategoryTreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

function buildTree(categories) {
  const map = new Map();
  const roots = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }

  for (const cat of map.values()) {
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId).children.push(cat);
    } else {
      roots.push(cat);
    }
  }

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name, 'ko');
    });
    for (const node of nodes) sortNodes(node.children);
    return nodes;
  };

  return sortNodes(roots);
}

const emptyForm = { name: '', description: '', sortOrder: '0', parentId: '' };

export default function SellerCategoryPage() {
  const { user, loading: authLoading } = useAuth();
  const isSeller = user?.role === 'SELLER';

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', target: null });
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  async function loadCategories() {
    try {
      setLoading(true);
      setErrorMessage('');
      const data = await getCategoriesApi();
      setCategories(data);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : '카테고리 목록을 불러오지 못했습니다.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isSeller) return;
    let cancelled = false;
    getCategoriesApi()
      .then((data) => { if (!cancelled) setCategories(data); })
      .catch((error) => {
        if (!cancelled)
          setErrorMessage(error instanceof ApiError ? error.message : '카테고리 목록을 불러오지 못했습니다.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isSeller]);

  function openCreate() {
    setForm(emptyForm);
    setFormErrors({});
    setSubmitError('');
    setModal({ open: true, mode: 'create', target: null });
  }

  function openEdit(category) {
    setForm({
      name: category.name,
      description: category.description || '',
      sortOrder: String(category.sortOrder),
      parentId: category.parentId || '',
    });
    setFormErrors({});
    setSubmitError('');
    setModal({ open: true, mode: 'edit', target: category });
  }

  function closeModal() {
    setModal({ open: false, mode: 'create', target: null });
  }

  function validate() {
    const errors = {};
    if (modal.mode === 'create' && !form.parentId)
      errors.parentId = '상위 카테고리를 선택해 주세요.';
    if (!form.name.trim()) errors.name = '카테고리명을 입력해 주세요.';
    else if (form.name.trim().length > 50) errors.name = '50자 이내로 입력해 주세요.';
    if (form.description.length > 500) errors.description = '500자 이내로 입력해 주세요.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        parentId: form.parentId,
      };
      if (modal.mode === 'create') {
        await createCategorySellerApi(payload);
      } else {
        await updateCategorySellerApi(modal.target.id, { ...payload, parentId: undefined });
      }
      closeModal();
      await loadCategories();
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : '저장에 실패했습니다. 다시 시도해 주세요.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(categoryId) {
    try {
      await deleteCategoryApi(categoryId);
      setDeleteConfirm(null);
      await loadCategories();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : '삭제에 실패했습니다.');
      setDeleteConfirm(null);
    }
  }

  if (authLoading) {
    return (
      <PageContainer>
        <p className="py-16 text-center text-sm text-gray-400">권한을 확인하는 중...</p>
      </PageContainer>
    );
  }

  if (!isSeller) return <Navigate to="/seller/register" replace />;

  const myCategories = categories.filter((c) => c.sellerId === user?.id);
  const tree = buildTree(categories);
  const selectableParents = categories.filter((c) => c.depth < 2);

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">카테고리 관리</h1>
        <p className="mt-1 text-sm text-gray-500">하위 카테고리를 추가하고 관리합니다.</p>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 전체 카테고리 트리 (참조용) */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
          <h2 className="mb-4 text-sm font-bold text-gray-500 uppercase tracking-wider">전체 카테고리 (참조)</h2>
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-400">불러오는 중...</p>
          ) : tree.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">등록된 카테고리가 없습니다.</p>
          ) : (
            <div className="space-y-0.5">
              {tree.map((node) => (
                <CategoryTreeNode key={node.id} node={node} />
              ))}
            </div>
          )}
        </div>

        {/* 내 카테고리 */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">내 카테고리</h2>
            <button
              type="button"
              onClick={openCreate}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              + 하위 카테고리 추가
            </button>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-gray-400">불러오는 중...</p>
          ) : myCategories.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
              <p className="text-sm text-gray-400">등록한 카테고리가 없습니다.</p>
              <p className="mt-1 text-xs text-gray-300">상위 카테고리를 선택해 하위 카테고리를 추가해 보세요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{cat.name}</span>
                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-600">
                          depth {cat.depth}
                        </span>
                      </div>
                      {cat.parentId && (
                        <p className="mt-0.5 text-xs text-gray-400">
                          상위: {getCategoryPath(categories, cat.parentId)}
                        </p>
                      )}
                      {cat.description && (
                        <p className="mt-1 text-xs text-gray-500 truncate">{cat.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {deleteConfirm === cat.id ? (
                        <>
                          <span className="text-xs text-red-500 font-medium">삭제하시겠습니까?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id)}
                            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-600"
                          >
                            확인
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(null)}
                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 transition hover:bg-gray-200"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(cat)}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                          >
                            편집
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(cat.id)}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 ring-1 ring-red-100 transition hover:bg-red-100"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="mb-6 text-xl font-bold text-gray-900">
              {modal.mode === 'create' ? '하위 카테고리 추가' : '카테고리 편집'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {modal.mode === 'create' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                    상위 카테고리 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.parentId}
                    onChange={(e) => { setForm((p) => ({ ...p, parentId: e.target.value })); setFormErrors((p) => ({ ...p, parentId: '' })); }}
                    className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                  >
                    <option value="">상위 카테고리를 선택하세요</option>
                    {selectableParents.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {'　'.repeat(cat.depth)}{cat.name} (depth {cat.depth})
                      </option>
                    ))}
                  </select>
                  {formErrors.parentId && <p className="mt-1 text-xs text-red-500">{formErrors.parentId}</p>}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                  카테고리명 <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setFormErrors((p) => ({ ...p, name: '' })); }}
                  placeholder="카테고리명을 입력하세요"
                  maxLength={50}
                  className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                />
                {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500">설명</label>
                <textarea
                  value={form.description}
                  onChange={(e) => { setForm((p) => ({ ...p, description: e.target.value })); setFormErrors((p) => ({ ...p, description: '' })); }}
                  placeholder="카테고리 설명 (선택)"
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 resize-none"
                />
                {formErrors.description && <p className="mt-1 text-xs text-red-500">{formErrors.description}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500">정렬 순서</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                />
              </div>

              {submitError && (
                <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{submitError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                >
                  {isSubmitting ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
