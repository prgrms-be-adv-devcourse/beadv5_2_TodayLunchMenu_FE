import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ApiError } from '../../api/client';
import {
  createCategoryAdminApi,
  deleteCategoryApi,
  getCategoriesApi,
  updateCategoryAdminApi,
} from '../../features/product/productApi';

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

function CategoryRow({ node, onAddChild, onEdit, onDelete, deleteConfirm, onDeleteConfirm, onDeleteCancel }) {
  const indent = node.depth * 24;
  const canAddChild = node.depth < 2;

  return (
    <>
      <tr className="border-b border-blue-50 transition hover:bg-blue-50/40">
        <td className="px-6 py-4" style={{ paddingLeft: `${24 + indent}px` }}>
          <div className="flex items-center gap-2">
            {node.depth > 0 && (
              <span className="text-blue-300 select-none">{'└'}</span>
            )}
            <span className="font-semibold text-gray-900">{node.name}</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600">
              depth {node.depth}
            </span>
          </div>
          {node.description && (
            <p className="mt-0.5 text-xs text-slate-400 truncate max-w-xs" style={{ paddingLeft: `${node.depth > 0 ? 16 : 0}px` }}>
              {node.description}
            </p>
          )}
        </td>
        <td className="px-4 py-4 text-sm text-slate-500 text-center">{node.sortOrder}</td>
        <td className="px-6 py-4">
          {deleteConfirm === node.id ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-600 font-medium">정말 삭제하시겠습니까?</span>
              <button
                type="button"
                onClick={() => onDelete(node.id)}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700"
              >
                확인
              </button>
              <button
                type="button"
                onClick={onDeleteCancel}
                className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-300"
              >
                취소
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-end">
              {canAddChild && (
                <button
                  type="button"
                  onClick={() => onAddChild(node.id)}
                  className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-200"
                >
                  + 하위
                </button>
              )}
              <button
                type="button"
                onClick={() => onEdit(node)}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-gray-200 transition hover:bg-blue-50"
              >
                편집
              </button>
              <button
                type="button"
                onClick={() => onDeleteConfirm(node.id)}
                className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 ring-1 ring-rose-100 transition hover:bg-rose-100"
              >
                삭제
              </button>
            </div>
          )}
        </td>
      </tr>
      {node.children.map((child) => (
        <CategoryRow
          key={child.id}
          node={child}
          onAddChild={onAddChild}
          onEdit={onEdit}
          onDelete={onDelete}
          deleteConfirm={deleteConfirm}
          onDeleteConfirm={onDeleteConfirm}
          onDeleteCancel={onDeleteCancel}
        />
      ))}
    </>
  );
}

const emptyForm = { name: '', description: '', sortOrder: '0', parentId: '' };

export default function AdminCategoryPage() {
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
    let mounted = true;
    getCategoriesApi()
      .then((data) => {
        if (mounted) setCategories(data);
      })
      .catch((error) => {
        if (mounted)
          setErrorMessage(
            error instanceof ApiError ? error.message : '카테고리 목록을 불러오지 못했습니다.'
          );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  function openCreate(presetParentId = '') {
    setForm({ ...emptyForm, parentId: presetParentId });
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
        parentId: form.parentId || null,
      };
      if (modal.mode === 'create') {
        await createCategoryAdminApi(payload);
      } else {
        await updateCategoryAdminApi(modal.target.id, payload);
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
      setErrorMessage(
        error instanceof ApiError ? error.message : '삭제에 실패했습니다.'
      );
      setDeleteConfirm(null);
    }
  }

  const tree = buildTree(categories);
  const selectableParents = categories.filter((c) => c.depth < 2);

  return (
    <>
          <header className="mb-8 flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">카테고리 관리</h1>
              <p className="mt-2 text-sm text-slate-500">카테고리를 추가·수정·삭제합니다. (최대 3단계)</p>
            </div>
            <button
              type="button"
              onClick={() => openCreate()}
              className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] hover:bg-blue-700"
            >
              + 최상위 카테고리 추가
            </button>
          </header>

          {errorMessage && (
            <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          <section className="overflow-hidden bg-white shadow-xl ring-1 ring-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-blue-50/70 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  <tr>
                    <th className="px-6 py-4">카테고리명</th>
                    <th className="px-4 py-4 text-center w-20">순서</th>
                    <th className="px-6 py-4 text-right">작업</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-16 text-center font-medium text-slate-500">
                        카테고리 목록을 불러오는 중입니다...
                      </td>
                    </tr>
                  ) : tree.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-16 text-center text-slate-500">
                        등록된 카테고리가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    tree.map((node) => (
                      <CategoryRow
                        key={node.id}
                        node={node}
                        onAddChild={openCreate}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        deleteConfirm={deleteConfirm}
                        onDeleteConfirm={setDeleteConfirm}
                        onDeleteCancel={() => setDeleteConfirm(null)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-blue-50/70 px-6 py-4 text-xs font-medium text-slate-500">
              총 {categories.length}개 카테고리
            </div>
          </section>
      {modal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white p-8 shadow-2xl ring-1 ring-gray-200">
            <h2 className="mb-6 text-xl font-extrabold text-gray-900">
              {modal.mode === 'create' ? '카테고리 추가' : '카테고리 편집'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  카테고리명 <span className="text-rose-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setFormErrors((p) => ({ ...p, name: '' })); }}
                  placeholder="카테고리명을 입력하세요"
                  maxLength={50}
                  className="h-11 w-full rounded border-none bg-blue-50 px-4 text-sm shadow-sm ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-blue-400"
                />
                {formErrors.name && <p className="mt-1 text-xs text-rose-500">{formErrors.name}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">설명</label>
                <textarea
                  value={form.description}
                  onChange={(e) => { setForm((p) => ({ ...p, description: e.target.value })); setFormErrors((p) => ({ ...p, description: '' })); }}
                  placeholder="카테고리 설명 (선택)"
                  maxLength={500}
                  rows={3}
                  className="w-full rounded border-none bg-blue-50 px-4 py-3 text-sm shadow-sm ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
                {formErrors.description && <p className="mt-1 text-xs text-rose-500">{formErrors.description}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">정렬 순서</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                  className="h-11 w-full rounded border-none bg-blue-50 px-4 text-sm shadow-sm ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">상위 카테고리</label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm((p) => ({ ...p, parentId: e.target.value }))}
                  className="h-11 w-full rounded border-none bg-blue-50 px-4 text-sm font-medium shadow-sm ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">없음 (최상위 카테고리)</option>
                  {selectableParents.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {'  '.repeat(cat.depth)}{cat.name} (depth {cat.depth})
                    </option>
                  ))}
                </select>
              </div>

              {submitError && (
                <p className="rounded bg-rose-50 px-4 py-2.5 text-sm text-rose-600">{submitError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="flex-1 bg-slate-100 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
