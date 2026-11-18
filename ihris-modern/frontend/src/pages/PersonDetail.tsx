import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { toast } from "sonner";
import { Pencil, Trash2, Phone, Wallet, Briefcase } from "lucide-react";
import { avatarTone, formatDate, formatNumber, initials } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import PageHeader from "@/components/ui/PageHeader";
import Pill from "@/components/ui/Pill";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateViews";

interface PersonDetail {
  id: number;
  surname: string;
  firstname: string;
  othername: string | null;
  countryId: number | null;
  districtId: number | null;
  countyId: number | null;
  residenceCountryId: number | null;
  residenceDistrictId: number | null;
  residenceCountyId: number | null;
  createdAt: string;
  updatedAt: string;
  contacts: Array<{
    id: number;
    telephone: string | null;
    email: string | null;
    address: string | null;
  }>;
  demographics: Array<{
    id: number;
    birthDate: string | null;
    genderId: number | null;
  }>;
  salaries: Array<{
    id: number;
    salary: string;
    startDate: string;
    endDate: string | null;
  }>;
  personPositions: Array<{
    id: number;
    position: {
      id: number;
      title: string | null;
      facility: { name: string } | null;
      job: { title: string } | null;
    };
    startDate: string | null;
    endDate: string | null;
  }>;
}

/** خلية وصف: تسمية + قيمة، مع حالة فراغ موحّدة. */
function DescItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  const text =
    value === null || value === undefined ? "" : String(value).trim();
  return (
    <div className="desc-item">
      <span className="desc-label">{label}</span>
      <span className={`desc-value${text ? "" : " empty"}`}>{text || "—"}</span>
    </div>
  );
}

/** المبلغ يصل كنص من الـAPI — نعرضه منسّقاً إن كان رقماً. */
function amountLabel(value: string): string {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? formatNumber(parsed) : value;
}

export default function PersonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const personId = parseInt(id || "0", 10);

  const currentUser = useAuthStore((state) => state.user);
  const canWrite =
    currentUser?.role === "admin" || currentUser?.role === "hr_manager";
  const isAdmin = currentUser?.role === "admin";

  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<PersonDetail>({
    queryKey: ["person", personId],
    queryFn: async () => {
      const res = await api.get(`/persons/${personId}`);
      return res.data;
    },
    enabled: !!personId,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/persons/${personId}`);
      return personId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["persons"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("تم حذف الموظف");
      navigate("/persons");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "فشل حذف الموظف");
    },
  });

  if (isLoading) {
    return (
      <div className="stack">
        <PageHeader
          title="ملف الموظف"
          subtitle="البيانات الشخصية ومعلومات الاتصال والسجلات المرتبطة"
          backTo="/persons"
          backLabel="رجوع إلى الموظفين"
        />
        <section className="card">
          <LoadingState label="جاري تحميل بيانات الموظف…" />
        </section>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="stack">
        <PageHeader
          title="ملف الموظف"
          subtitle="البيانات الشخصية ومعلومات الاتصال والسجلات المرتبطة"
          backTo="/persons"
          backLabel="رجوع إلى الموظفين"
        />
        <ErrorState
          title="لم يتم العثور على الموظف"
          message={
            error instanceof Error ? error.message : "السجل غير موجود أو حُذف."
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const fullName = `${data.firstname} ${data.surname}`;

  return (
    <div className="stack">
      <PageHeader
        title={`${data.surname} ${data.firstname}`}
        subtitle={`رقم الموظف: #${formatNumber(data.id)}`}
        backTo="/persons"
        backLabel="رجوع إلى الموظفين"
        actions={
          <>
            {canWrite && (
              <a
                className="btn btn-primary"
                href={`/persons/${data.id}/edit`}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(`/persons/${data.id}/edit`);
                }}
              >
                <Pencil aria-hidden="true" />
                تعديل البيانات
              </a>
            )}
            {isAdmin && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 aria-hidden="true" />
                حذف الموظف
              </button>
            )}
          </>
        }
      />

      <section className="card">
        <div className="card-body">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <span
              className={`avatar lg ${avatarTone(data.id)}`}
              aria-hidden="true"
            >
              {initials(data.firstname, data.surname)}
            </span>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: 17 }}>{fullName}</h2>
              <p className="muted" style={{ fontSize: 12.5 }}>
                {data.othername || "لا توجد أسماء أخرى مسجّلة"}
              </p>
            </div>
            <div className="cluster" style={{ marginInlineStart: "auto" }}>
              <Pill tone="mute">رقم السجل: {formatNumber(data.id)}</Pill>
              <Pill tone="mute">
                تاريخ التسجيل: {formatDate(data.createdAt)}
              </Pill>
            </div>
          </div>
        </div>
      </section>

      <div className="grid-2" style={{ marginBottom: 0 }}>
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">البيانات الشخصية</h2>
            <span className="card-sub">آخر تحديث: {formatDate(data.updatedAt)}</span>
          </div>
          <div className="card-body">
            <div className="desc-grid">
              <DescItem label="الاسم الأول" value={data.firstname} />
              <DescItem label="اللقب" value={data.surname} />
              <DescItem label="الأسماء الأخرى" value={data.othername} />
              <DescItem label="معرّف الدولة" value={data.countryId} />
              <DescItem label="معرّف المحافظة" value={data.districtId} />
              <DescItem label="معرّف المديرية" value={data.countyId} />
              <DescItem label="معرّف دولة الإقامة" value={data.residenceCountryId} />
              <DescItem
                label="معرّف محافظة الإقامة"
                value={data.residenceDistrictId}
              />
              <DescItem label="معرّف مديرية الإقامة" value={data.residenceCountyId} />
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2 className="card-title">معلومات الاتصال</h2>
            <span className="card-sub">
              {formatNumber(data.contacts?.length ?? 0)} سجل
            </span>
          </div>
          {(data.contacts?.length || 0) > 0 ? (
            <div className="table-wrap">
              <table className="data-table data-table--dense">
                <thead>
                  <tr>
                    <th scope="col">الهاتف</th>
                    <th scope="col">البريد</th>
                    <th scope="col" className="col-optional">
                      العنوان
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.contacts.map((contact) => (
                    <tr key={contact.id}>
                      <td className="num">{contact.telephone || "غير محدد"}</td>
                      <td>{contact.email || "—"}</td>
                      <td className="col-optional">{contact.address || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Phone}
              title="لا توجد بيانات اتصال"
              text="لم تُسجَّل أرقام هاتف أو بريد لهذا الموظف."
            />
          )}
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">السجلات المالية</h2>
          <span className="card-sub">
            {formatNumber(data.salaries?.length ?? 0)} سجل راتب
          </span>
        </div>
        {(data.salaries?.length || 0) > 0 ? (
          <div className="table-wrap">
            <table className="data-table data-table--dense">
              <thead>
                <tr>
                  <th scope="col" style={{ textAlign: "end" }}>
                    المبلغ
                  </th>
                  <th scope="col">من تاريخ</th>
                  <th scope="col">إلى تاريخ</th>
                </tr>
              </thead>
              <tbody>
                {data.salaries.map((salary) => (
                  <tr key={salary.id}>
                    <td className="num" style={{ textAlign: "end" }}>
                      {amountLabel(salary.salary)}
                    </td>
                    <td className="mono">{formatDate(salary.startDate)}</td>
                    <td className="mono">
                      {salary.endDate ? formatDate(salary.endDate) : "حتى الآن"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Wallet}
            title="لا توجد سجلات رواتب"
            text="لم تُسجَّل أي رواتب لهذا الموظف بعد."
          />
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">الوظائف المحتلة</h2>
          <span className="card-sub">
            {formatNumber(data.personPositions?.length ?? 0)} وظيفة
          </span>
        </div>
        {(data.personPositions?.length || 0) > 0 ? (
          <div className="table-wrap">
            <table className="data-table data-table--dense">
              <thead>
                <tr>
                  <th scope="col">المسمى الوظيفي</th>
                  <th scope="col" className="col-optional">
                    المنشأة
                  </th>
                  <th scope="col" className="col-compact">
                    تاريخ البداية
                  </th>
                  <th scope="col" className="col-compact">
                    تاريخ النهاية
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.personPositions.map((record) => (
                  <tr key={record.id}>
                    <td>
                      {record.position.title ||
                        record.position.job?.title ||
                        "—"}
                    </td>
                    <td className="col-optional">
                      {record.position.facility?.name || "—"}
                    </td>
                    <td className="mono col-compact">
                      {record.startDate ? formatDate(record.startDate) : "—"}
                    </td>
                    <td className="mono col-compact">
                      {record.endDate ? formatDate(record.endDate) : "حتى الآن"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="لا توجد وظائف مسجلة"
            text="لم يُسجَّل هذا الموظف على أي وظيفة بعد."
          />
        )}
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title="حذف الموظف"
        text={
          <>
            سيتم حذف سجل <strong>{fullName}</strong> نهائياً. لا يمكن التراجع عن
            هذا الإجراء.
          </>
        }
        pending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
