// Sales agency agreement between BCT and a sales agent/partner (not the
// customer-facing service contract in contract-clauses.ts). Same permanent
// bilingual (Indonesian primary, Korean secondary) convention as every
// other document in this codebase — agents themselves are a mix of Korean
// and Indonesian individuals/companies, so neither language is assumed.

import type { Agent } from '@/types/domain';

export interface BilingualText {
  id: string;
  ko: string;
}

export interface ClauseSection {
  heading: BilingualText;
  items: BilingualText[];
}

export function agentAgreementClauses(agent: Agent): ClauseSection[] {
  return [
    {
      heading: { id: '1. Tujuan Perjanjian', ko: '1. 계약의 목적' },
      items: [
        {
          id: 'Perjanjian ini dibuat agar PT. Bumi Cerdas Teknologi ("BCT") menunjuk Mitra sebagai agen penjualan non-eksklusif untuk memperkenalkan dan mendukung calon pelanggan atas layanan Managed IT Outsourcing dan layanan terkait yang disediakan BCT.',
          ko: '본 계약은 PT. Bumi Cerdas Teknologi(이하 "BCT")가 대리점을 BCT의 Managed IT Outsourcing 및 관련 서비스에 대한 비독점적 영업 파트너로 지정하기 위해 체결한다.',
        },
        {
          id: 'Hubungan ini bersifat non-eksklusif — Mitra dapat menjalankan usaha atau kemitraan lain, dan BCT dapat menunjuk agen penjualan lain, sepanjang tidak melanggar kewajiban kerahasiaan pada Pasal 6.',
          ko: '본 관계는 비독점적이며, 대리점은 다른 사업이나 제휴를 수행할 수 있고 BCT 역시 다른 영업대리점을 둘 수 있다. 단, 제6조의 비밀유지 의무는 유지된다.',
        },
      ],
    },
    {
      heading: { id: '2. Lingkup Peran dan Batasan Kewenangan', ko: '2. 대리점의 역할 및 권한 범위' },
      items: [
        {
          id: 'Mitra bertugas memperkenalkan calon pelanggan, membantu konsultasi awal kebutuhan, dan mendampingi proses penjualan sesuai dengan harga dan paket yang ditetapkan BCT.',
          ko: '대리점은 잠재 고객을 소개하고, 초기 니즈 상담을 지원하며, BCT가 정한 가격 및 패키지 범위 내에서 판매 과정을 보조하는 역할을 수행한다.',
        },
        {
          id: 'Mitra tidak berwenang menandatangani kontrak, mengubah harga/persyaratan, memberikan diskon, atau membuat komitmen apa pun yang mengikat BCT tanpa persetujuan tertulis dari BCT terlebih dahulu.',
          ko: '대리점은 BCT의 사전 서면 승인 없이 계약을 체결하거나, 가격·조건을 변경하거나, 할인을 제공하거나, BCT를 구속하는 어떠한 약정도 할 권한이 없다.',
        },
        {
          id: 'Kontrak layanan yang sah hanya yang ditandatangani langsung oleh perwakilan resmi BCT dan Pelanggan.',
          ko: '유효한 서비스 계약은 BCT의 공식 대표자와 고객이 직접 서명한 계약만을 의미한다.',
        },
      ],
    },
    {
      heading: { id: '3. Perhitungan dan Pembayaran Komisi', ko: '3. 수수료 산정 및 지급' },
      items: [
        {
          id: `Tarif komisi Mitra saat ini adalah ${agent.rate}% dari basis komisi (biaya layanan bulanan yang dapat dikomisikan) setiap kontrak pelanggan yang berhasil diperkenalkan oleh Mitra dan ditandatangani oleh BCT.`,
          ko: `대리점의 현재 수수료율은 대리점이 소개하여 BCT와 체결된 각 고객 계약의 수수료 산정 기준액(커미션 대상 월 서비스 요금)의 ${agent.rate}%이다.`,
        },
        {
          id: 'Komisi dibayarkan sebesar 100% dari tarif selama masa kontrak pelanggan berjalan. Setelah masa kontrak berakhir, apabila Pelanggan tetap menggunakan layanan BCT, komisi sebesar 50% dari tarif akan terus dibayarkan tanpa batas waktu selama Pelanggan masih menggunakan layanan tersebut.',
          ko: '수수료는 고객 계약기간 동안 요율의 100%가 지급된다. 계약기간이 종료된 이후에도 고객이 BCT 서비스를 계속 이용하는 경우, 그 사용 기간 내내 요율의 50%가 기한 없이 계속 지급된다.',
        },
        {
          id: 'Tarif komisi Mitra pada umumnya mengikuti tarif standar yang disepakati, namun untuk layanan atau perangkat tertentu dapat berlaku tarif khusus yang berbeda dari tarif standar tersebut. Sebagai contoh, BCT dapat menetapkan perangkat tertentu untuk dikenakan tarif komisi khusus alih-alih tarif standar Mitra, sebagaimana ditentukan dalam katalog harga BCT.',
          ko: '대리점의 영업수수료는 원칙적으로 합의된 표준 요율을 따르나, 특정 서비스나 장비에 대해서는 표준 요율과 다른 별도의 특별 요율이 적용될 수 있다. 예를 들어 BCT는 특정 장비를 지정하여 대리점의 표준 요율이 아닌 별도의 특별 요율을 정할 수 있으며, 이는 BCT의 가격 카탈로그에 반영된다.',
        },
        {
          id: 'Komisi dihitung dari tagihan yang benar-benar dibayar oleh Pelanggan — tidak ada komisi atas tagihan yang belum lunas, ditolak, atau dibatalkan.',
          ko: '수수료는 고객이 실제로 납부한 청구액을 기준으로 산정하며, 미납·거절·취소된 청구액에 대해서는 수수료가 지급되지 않는다.',
        },
        {
          id: 'BCT akan merekap dan membayarkan komisi setiap bulan melalui transfer ke rekening bank yang telah didaftarkan Mitra, setelah tagihan pelanggan terkait berhasil ditagihkan.',
          ko: 'BCT는 매월 관련 고객 청구가 완료된 이후, 대리점이 등록한 계좌로 수수료를 정산하여 지급한다.',
        },
      ],
    },
    {
      heading: { id: '4. Perubahan Tarif Komisi', ko: '4. 수수료율 변경' },
      items: [
        {
          id: 'BCT dapat menyesuaikan tarif komisi ke depan dengan pemberitahuan tertulis kepada Mitra. Perubahan tarif hanya berlaku untuk kontrak pelanggan baru yang ditandatangani setelah tanggal perubahan, dan tidak memengaruhi tarif kontrak pelanggan yang sudah berjalan.',
          ko: 'BCT는 대리점에 서면 통지 후 수수료율을 장래에 대해 조정할 수 있다. 변경된 요율은 변경일 이후 신규로 체결되는 고객 계약에만 적용되며, 이미 진행 중인 고객 계약의 요율에는 영향을 미치지 않는다.',
        },
        {
          id: 'Riwayat tarif komisi Mitra dicatat dan dapat diperiksa oleh Mitra melalui sistem BCT.',
          ko: '대리점의 수수료율 변경 이력은 기록되며, 대리점은 BCT 시스템을 통해 확인할 수 있다.',
        },
      ],
    },
    {
      heading: { id: '5. Status Kemitraan Independen', ko: '5. 독립적 파트너 지위' },
      items: [
        {
          id: 'Mitra adalah rekanan independen, bukan karyawan, perwakilan hukum, atau agen dalam arti hukum yang dapat mengikat BCT. Tidak ada hubungan kerja (employment) yang timbul dari Perjanjian ini.',
          ko: '대리점은 독립적인 파트너이며, BCT의 직원, 법률상 대리인 또는 BCT를 구속할 수 있는 법적 의미의 에이전트가 아니다. 본 계약으로부터 고용관계는 발생하지 않는다.',
        },
        {
          id: 'Mitra menanggung biaya operasionalnya sendiri (transportasi, komunikasi, dll.) dalam menjalankan aktivitas sebagai agen penjualan, kecuali disepakati lain secara tertulis.',
          ko: '대리점은 별도의 서면 합의가 없는 한, 영업활동에 소요되는 비용(교통비, 통신비 등)을 자체적으로 부담한다.',
        },
      ],
    },
    {
      heading: { id: '6. Kerahasiaan', ko: '6. 비밀유지' },
      items: [
        {
          id: 'Mitra wajib menjaga kerahasiaan informasi Pelanggan, struktur harga, materi penawaran, dan informasi internal BCT lainnya yang diperoleh dalam menjalankan Perjanjian ini, dan tidak menggunakannya untuk tujuan di luar kepentingan BCT.',
          ko: '대리점은 본 계약 수행 과정에서 알게 된 고객정보, 가격구조, 견적자료 및 그 외 BCT의 내부정보를 비밀로 유지해야 하며, BCT의 이익 이외의 목적으로 사용해서는 안 된다.',
        },
        {
          id: 'Kewajiban kerahasiaan ini tetap berlaku setelah Perjanjian ini berakhir atau diakhiri.',
          ko: '본 비밀유지 의무는 본 계약이 종료 또는 해지된 이후에도 계속 유효하다.',
        },
      ],
    },
    {
      heading: { id: '7. Jangka Waktu dan Pengakhiran Perjanjian', ko: '7. 계약기간 및 해지' },
      items: [
        {
          id: 'Perjanjian ini berlaku sejak tanggal penandatanganan dan berlanjut tanpa batas waktu, hingga diakhiri oleh salah satu pihak dengan pemberitahuan tertulis minimal 30 hari sebelumnya.',
          ko: '본 계약은 서명일로부터 효력이 발생하며, 어느 일방이 최소 30일 전 서면 통지로 해지하기 전까지 기한 없이 유지된다.',
        },
        {
          id: 'Pengakhiran Perjanjian ini tidak menghapuskan hak Mitra atas komisi yang timbul dari kontrak pelanggan yang telah ditandatangani sebelum tanggal pengakhiran — komisi tersebut tetap dibayarkan sesuai skema pada Pasal 3 selama Pelanggan terkait masih menggunakan layanan BCT.',
          ko: '본 계약이 해지되더라도, 해지일 이전에 체결된 고객 계약으로부터 발생하는 대리점의 수수료 청구권은 소멸하지 않으며, 해당 고객이 BCT 서비스를 계속 이용하는 동안 제3조의 지급 방식에 따라 계속 지급된다.',
        },
        {
          id: 'BCT dapat mengakhiri Perjanjian ini secara langsung apabila Mitra melanggar Pasal 2 atau Pasal 6, atau melakukan tindakan yang merugikan reputasi BCT.',
          ko: '대리점이 제2조 또는 제6조를 위반하거나 BCT의 명예를 훼손하는 행위를 한 경우, BCT는 즉시 본 계약을 해지할 수 있다.',
        },
      ],
    },
    {
      heading: { id: '8. Pajak', ko: '8. 세금' },
      items: [
        {
          id: 'Mitra bertanggung jawab atas pelaporan dan pembayaran pajak pribadi/badan atas pendapatan komisi yang diterima, sesuai dengan peraturan perpajakan yang berlaku di Indonesia. BCT dapat melakukan pemotongan pajak sesuai kewajiban hukumnya.',
          ko: '대리점은 수령한 수수료 소득에 대하여 인도네시아 세법에 따른 개인/법인세 신고 및 납부의 책임을 진다. BCT는 법적 의무에 따라 세금을 원천징수할 수 있다.',
        },
      ],
    },
    {
      heading: { id: '9. Lain-lain', ko: '9. 기타' },
      items: [
        {
          id: 'Perjanjian ini diatur oleh hukum Republik Indonesia. Setiap perselisihan akan diselesaikan melalui musyawarah terlebih dahulu, kemudian melalui pengadilan yang berwenang atau prosedur arbitrase yang disepakati bersama.',
          ko: '본 계약은 인도네시아 법을 준거법으로 한다. 분쟁이 발생하는 경우 우선 상호 협의를 통해 해결하며, 협의가 이루어지지 않을 경우 관할 법원 또는 양 당사자가 합의한 중재절차에 따른다.',
        },
        {
          id: 'Perubahan atas Perjanjian ini hanya berlaku jika dibuat secara tertulis dan disetujui oleh kedua belah pihak.',
          ko: '본 계약의 변경은 양 당사자가 서면으로 합의한 경우에만 유효하다.',
        },
      ],
    },
  ];
}
