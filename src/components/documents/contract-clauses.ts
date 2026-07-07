// Ported from the source app's contractDocument() (index.html ~line 289),
// restructured for the permanent bilingual (Indonesian primary, Korean
// secondary) rendering used for all customer-facing contracts. The
// Indonesian text is a first-pass professional translation of the
// Korean legal source — for real customer contracts, a native Indonesian
// speaker or legal reviewer should sanity-check it before it ships.

import type { Contract } from '@/types/domain';

export interface BilingualText {
  id: string;
  ko: string;
}

export interface ClauseSection {
  heading: BilingualText;
  items: BilingualText[];
}

export function contractClauses(contract: Contract): ClauseSection[] {
  return [
    {
      heading: { id: '1. Tujuan Perjanjian dan Sifat Layanan', ko: '1. 계약 목적 및 서비스 성격' },
      items: [
        {
          id: 'Perjanjian ini dibuat agar BCT menyediakan layanan Managed IT Outsourcing, pembangunan dan pengelolaan jaringan, pemeliharaan perangkat, dukungan jarak jauh/on-site, VPN, serta pemantauan keamanan kepada Pelanggan.',
          ko: '본 계약은 BCT가 고객에게 Managed IT Outsourcing, 네트워크 구축·관리, 장비 유지보수, 원격/현장 지원, VPN 및 보안관제 서비스를 제공하기 위한 계약이다.',
        },
        {
          id: 'BCT tidak menandatangani perjanjian ini sebagai penyedia layanan internet (ISP), operator telekomunikasi, penjual kembali (reseller) Starlink, atau agen resmi Starlink.',
          ko: 'BCT는 인터넷서비스제공자(ISP), 통신사업자, Starlink 재판매자 또는 Starlink 공식 대리점으로서 본 계약을 체결하는 것이 아니다.',
        },
        {
          id: 'Layanan internet Starlink didaftarkan langsung atas nama Pelanggan, dan Pelanggan membayar biaya langsung kepada Starlink. BCT dapat membantu proses pendaftaran, instalasi, dan koneksi jaringan Starlink, namun tidak menjual kembali layanan internet Starlink.',
          ko: 'Starlink 인터넷 서비스는 고객 명의로 직접 가입하고 고객이 직접 Starlink에 요금을 납부한다. BCT는 Starlink 가입·설치·네트워크 연결을 보조할 수 있으나, Starlink 인터넷 서비스를 재판매하지 않는다.',
        },
      ],
    },
    {
      heading: { id: '2. Lingkup Layanan', ko: '2. 서비스 범위' },
      items: [
        {
          id: 'Layanan yang termasuk: konfigurasi dan pengelolaan router MikroTik, pemeliharaan AP/Hub, penanganan gangguan jaringan dasar, dukungan koneksi jaringan PC, pemeriksaan status jaringan/rekaman CCTV milik Pelanggan, Managed VPN, dan pemantauan perangkat keamanan — sesuai item yang tercantum dalam surat penawaran (quotation).',
          ko: '포함 서비스: MikroTik 라우터 설정·관리, AP/Hub 유지보수, 기본 네트워크 장애 대응, PC 네트워크 접속 지원, 고객 보유 CCTV의 네트워크/녹화상태 점검, Managed VPN, 보안장비 관제 중 견적서에 명시된 항목.',
        },
        {
          id: 'Layanan yang tidak termasuk: instalasi baru dan pembelian perangkat CCTV, komponen/consumable/lisensi PC, instalasi ulang OS, pemulihan data, penanganan insiden ransomware/hacking, pekerjaan pengkabelan skala besar, perbaikan gangguan layanan pihak ketiga, kerusakan perangkat akibat kelalaian Pelanggan, serta konsultasi keamanan tambahan.',
          ko: '미포함 서비스: CCTV 신규 설치 및 장비 구매, PC 부품·소모품·라이선스, OS 재설치, 데이터복구, 랜섬웨어/해킹 사고복구, 대규모 배선공사, 타사 서비스 장애복구, 고객 과실로 인한 장비 파손, 별도 보안컨설팅.',
        },
        {
          id: 'Pekerjaan yang tidak tercantum dalam surat penawaran atau perjanjian tambahan akan dilaksanakan setelah ada penawaran biaya terpisah dan persetujuan dari Pelanggan.',
          ko: '견적서 또는 부속합의서에 명시되지 않은 작업은 별도 견적 및 고객 승인 후 진행한다.',
        },
      ],
    },
    {
      heading: {
        id: '3. Layanan Pihak Ketiga dan Pembebasan Tanggung Jawab terkait Starlink',
        ko: '3. 제3자 서비스 및 Starlink 관련 면책',
      },
      items: [
        {
          id: 'BCT tidak bertanggung jawab atas perubahan kebijakan, gangguan, penurunan kecepatan, penangguhan akun, perubahan tarif, kepadatan wilayah, atau masalah kualitas satelit/jaringan dari layanan pihak ketiga seperti Starlink, listrik, jaringan telekomunikasi, cloud, perangkat lunak, dan lisensi perangkat keamanan.',
          ko: 'Starlink, 전력, 통신망, 클라우드, 소프트웨어, 보안장비 라이선스 등 제3자 서비스의 정책변경, 장애, 속도저하, 계정정지, 요금변경, 지역 혼잡, 위성/망 품질 문제에 대해 BCT는 책임을 부담하지 않는다.',
        },
        {
          id: 'Pembatasan layanan yang timbul akibat keterlambatan pembayaran Starlink, pelanggaran ketentuan layanan, kesalahan informasi akun, atau kegagalan pendaftaran atas nama Pelanggan menjadi tanggung jawab Pelanggan.',
          ko: '고객의 Starlink 요금 미납, 약관 위반, 계정정보 오류, 고객 명의 등록 불이행으로 발생하는 서비스 제한은 고객 책임이다.',
        },
        {
          id: 'Dukungan BCT terbatas pada konfigurasi dan pengoperasian layanan serta perangkat yang secara sah didaftarkan dan dimiliki oleh Pelanggan.',
          ko: 'BCT의 지원은 고객이 적법하게 가입·보유한 서비스와 장비를 구성·운영하는 범위로 제한된다.',
        },
      ],
    },
    {
      heading: { id: '4. Kepemilikan dan Pengembalian Perangkat', ko: '4. 장비 소유권 및 반환' },
      items: [
        {
          id: 'Perangkat yang disediakan BCT seperti MikroTik, AP, Hub, FortiGate, dan lainnya tetap menjadi milik BCT kecuali ada perjanjian jual-beli terpisah, dan Pelanggan hanya dapat menggunakannya untuk keperluan operasional selama masa kontrak.',
          ko: 'BCT가 제공한 MikroTik, AP, Hub, FortiGate 등 장비는 별도 매각 합의가 없는 한 BCT 소유이며, 고객은 계약기간 동안 업무 목적에 한해 사용한다.',
        },
        {
          id: 'Pada saat kontrak berakhir atau diakhiri, Pelanggan wajib mengembalikan perangkat milik BCT dalam kondisi normal. Jika terjadi kehilangan, kerusakan, atau pemindahan tanpa izin, Pelanggan menanggung biaya penggantian dan biaya penarikan perangkat.',
          ko: '계약 종료 또는 해지 시 고객은 BCT 제공 장비를 정상 상태로 반환해야 하며, 분실·훼손·임의반출 시 교체비와 회수비를 부담한다.',
        },
        {
          id: 'Perangkat Starlink, CCTV, PC, server, printer, dan lainnya yang dibeli langsung oleh Pelanggan adalah milik Pelanggan dan tidak termasuk dalam perangkat yang disediakan BCT.',
          ko: '고객이 직접 구매한 Starlink 장비, CCTV, PC, 서버, 프린터 등은 고객 소유이며 BCT 제공 장비에 포함되지 않는다.',
        },
      ],
    },
    {
      heading: { id: '5. SLA, Penanganan Gangguan, dan Batasan', ko: '5. SLA, 장애대응 및 한계' },
      items: [
        {
          id: 'BCT akan menangani gangguan dengan upaya yang wajar secara komersial, namun tanpa SLA terpisah, BCT tidak menjamin layanan tanpa gangguan, kecepatan tertentu, atau waktu pemulihan tertentu.',
          ko: 'BCT는 상업적으로 합리적인 노력으로 장애를 처리하되, 별도 SLA가 없는 한 무중단 서비스, 특정 속도, 특정 복구시간을 보장하지 않는다.',
        },
        {
          id: 'Gangguan yang dapat ditangani secara jarak jauh akan diprioritaskan untuk diselesaikan secara remote. Kunjungan ke lokasi akan disesuaikan berdasarkan jumlah kunjungan yang disepakati dalam kontrak, lokasi, jam operasional, dan ketersediaan personel.',
          ko: '원격지원이 가능한 장애는 원격으로 우선 처리하며, 현장방문은 계약상 방문횟수, 지역, 영업시간, 인력상황에 따라 조정된다.',
        },
        {
          id: 'Pekerjaan pada malam hari, hari libur, panggilan darurat, atau di luar lingkup kontrak dapat dikenakan biaya tambahan.',
          ko: '야간·휴일·긴급출동·계약범위 외 작업은 별도 비용이 발생할 수 있다.',
        },
      ],
    },
    {
      heading: {
        id: '6. Keamanan, VPN, Data Pribadi, dan Akses Jarak Jauh',
        ko: '6. 보안, VPN, 개인정보 및 원격접속',
      },
      items: [
        {
          id: 'Pelanggan menyetujui bahwa BCT dapat melakukan akses jarak jauh, menggunakan akun administrator, memeriksa log, dan mengubah konfigurasi jaringan sejauh diperlukan untuk penanganan gangguan dan pemantauan.',
          ko: '고객은 BCT가 장애처리 및 관제를 위해 필요한 범위에서 원격접속, 관리자 계정 사용, 로그 확인, 네트워크 설정 변경을 수행할 수 있도록 승인한다.',
        },
        {
          id: 'BCT akan menjaga kerahasiaan informasi Pelanggan dan informasi akses, namun dapat memberikannya kepada pihak ketiga sejauh diwajibkan oleh hukum atau atas persetujuan Pelanggan.',
          ko: 'BCT는 고객정보와 접속정보를 비밀로 유지하되, 법령상 요구 또는 고객 승인 시 필요한 범위에서 제3자에게 제공할 수 있다.',
        },
        {
          id: 'Pemantauan perangkat keamanan adalah layanan untuk mengurangi risiko, dan tidak menjamin pencegahan penuh terhadap hacking, malware, kebocoran data oleh pihak internal, kelalaian pengguna, atau serangan zero-day.',
          ko: '보안장비 관제는 위험을 줄이기 위한 서비스이며 해킹, 악성코드, 내부자 유출, 사용자의 부주의, 제로데이 공격을 완전히 방지한다고 보장하지 않는다.',
        },
        {
          id: 'Pelanggan wajib menyimpan cadangan (backup) data penting secara terpisah, dan BCT tidak bertanggung jawab atas kehilangan data, kerugian usaha, atau kerugian tidak langsung yang timbul akibat kelalaian Pelanggan dalam melakukan backup.',
          ko: '고객은 중요 데이터에 대해 별도 백업을 유지해야 하며, BCT는 고객의 백업 미비로 인한 데이터 손실, 영업손실, 간접손해에 책임지지 않는다.',
        },
      ],
    },
    {
      heading: { id: '7. Kewajiban Pelanggan', ko: '7. 고객의 의무' },
      items: [
        {
          id: 'Pelanggan wajib menyediakan sumber daya listrik, ruang, izin akses, petugas penghubung, hak akses perangkat, perangkat lunak/lisensi yang sah, serta akun layanan pihak ketiga.',
          ko: '고객은 전원, 공간, 출입권한, 담당자, 장비 접근권한, 합법적인 소프트웨어/라이선스, 제3자 서비스 계정을 제공해야 한다.',
        },
        {
          id: 'Pelanggan tidak boleh menggunakan jaringan untuk tindakan ilegal, spam, pelanggaran hak cipta, perjudian, hacking, penyebaran malware, atau pelanggaran regulasi lainnya.',
          ko: '고객은 네트워크를 불법행위, 스팸, 저작권 침해, 도박, 해킹, 악성코드 유포, 규제위반 목적으로 사용해서는 안 된다.',
        },
        {
          id: 'Gangguan yang timbul akibat perubahan konfigurasi sepihak oleh Pelanggan, pemindahan perangkat, atau pekerjaan oleh pihak yang tidak berwenang dapat dikenakan biaya tambahan.',
          ko: '고객의 임의 설정변경, 장비 이동, 비인가 업체 작업으로 인한 장애는 별도 비용 처리될 수 있다.',
        },
      ],
    },
    {
      heading: { id: '8. Biaya, Tanggal Mulai Penagihan, dan Pajak', ko: '8. 요금, 과금시작일 및 세금' },
      items: [
        {
          id: `Biaya layanan bulanan sesuai surat penawaran adalah ${contract.monthly_fee.toLocaleString('id-ID')} belum termasuk PPN. Tanggal mulai penagihan ditetapkan pada ${contract.billing_date || contract.start_date}.`,
          ko: `월 서비스 요금은 견적서 기준 ${contract.monthly_fee.toLocaleString('id-ID')}이며 PPN은 별도이다. 과금시작일은 ${contract.billing_date || contract.start_date}로 한다.`,
        },
        {
          id: 'Pelanggan wajib membayar dalam batas waktu yang disepakati setelah menerima invoice, dan jika terlambat, BCT dapat menghentikan sementara penyediaan layanan.',
          ko: '고객은 청구서 수령 후 약정된 지급기한 내에 지급해야 하며, 지연 시 BCT는 서비스 제공을 일시 중단할 수 있다.',
        },
        {
          id: 'Biaya Starlink dibayarkan langsung oleh Pelanggan kepada Starlink dan tidak termasuk dalam biaya layanan bulanan BCT.',
          ko: 'Starlink 요금은 고객이 직접 Starlink에 납부하며 BCT 월 서비스 요금에 포함되지 않는다.',
        },
      ],
    },
    {
      heading: { id: '9. Masa Kontrak, Pengakhiran Dini, dan Biaya', ko: '9. 계약기간, 조기해지 및 수수료' },
      items: [
        {
          id: `Masa kontrak adalah ${contract.months} bulan, dengan tanggal mulai layanan pada ${contract.start_date} dan tanggal berakhir kontrak pada ${contract.end_date}.`,
          ko: `계약기간은 ${contract.months}개월이며, 서비스 시작일은 ${contract.start_date}, 계약종료일은 ${contract.end_date}이다.`,
        },
        {
          id: 'Jika kontrak diakhiri lebih awal karena kesalahan atau kepentingan Pelanggan, Pelanggan wajib membayar biaya yang belum lunas, sisa nilai belum diamortisasi dari biaya perangkat/instalasi/setting yang disediakan BCT, denda sebesar 50% dari sisa nilai tersebut, serta biaya pembongkaran, penarikan, dan administrasi.',
          ko: '고객의 귀책 또는 편의에 의한 조기해지 시 고객은 미납요금, BCT 제공 장비/설치/세팅 원가의 미상각 잔액, 해당 잔액의 50% 상당 패널티, 철거·회수·행정비를 지급한다.',
        },
        {
          id: 'Pada saat pengakhiran kontrak, BCT akan menarik kembali perangkat yang disediakan BCT, dan Pelanggan wajib memberikan akses lokasi yang diperlukan untuk proses penarikan tersebut.',
          ko: '해지 시 BCT는 BCT 제공 장비를 회수하고, 고객은 회수에 필요한 현장접근을 제공해야 한다.',
        },
      ],
    },
    {
      heading: { id: '10. Batasan Tanggung Jawab', ko: '10. 책임 제한' },
      items: [
        {
          id: 'Tanggung jawab BCT terbatas pada kerugian langsung, dan BCT tidak bertanggung jawab atas kerugian khusus, kerugian tidak langsung, kerugian usaha, kerugian pendapatan, kerusakan reputasi, kehilangan data, atau klaim dari pihak ketiga.',
          ko: 'BCT의 책임은 직접손해에 한정되며, 특별손해, 간접손해, 영업손실, 매출손실, 평판손상, 데이터손실, 제3자 청구에 대해서는 책임지지 않는다.',
        },
        {
          id: 'Sejauh diizinkan oleh hukum, total tanggung jawab kompensasi BCT dibatasi sebesar jumlah biaya layanan bulanan yang benar-benar dibayarkan oleh Pelanggan dalam 3 bulan terakhir.',
          ko: '법령상 허용되는 범위 내에서 BCT의 총 배상책임은 최근 3개월간 고객이 실제 지급한 월 서비스 요금을 한도로 한다.',
        },
      ],
    },
    {
      heading: { id: '11. Lain-lain', ko: '11. 기타' },
      items: [
        {
          id: 'Keterlambatan atau kegagalan pelaksanaan akibat force majeure, regulasi pemerintah, pemadaman listrik, bencana alam, perang, kerusuhan, gangguan backbone internet, atau gangguan layanan pihak ketiga dibebaskan dari tanggung jawab.',
          ko: '불가항력, 정부규제, 정전, 천재지변, 전쟁, 폭동, 인터넷 백본 장애, 제3자 서비스 장애로 인한 지연 또는 불이행은 면책된다.',
        },
        {
          id: 'Jika terdapat perbedaan antara perjanjian ini dan surat penawaran, maka cakupan layanan dan nilai nominal mengacu pada surat penawaran, sedangkan ketentuan hukum mengacu pada perjanjian ini.',
          ko: '본 계약과 견적서가 충돌하는 경우 서비스 범위와 금액은 견적서가 우선하며, 법적 조건은 본 계약이 우선한다.',
        },
        {
          id: 'Perjanjian ini diatur oleh hukum Republik Indonesia, dan setiap perselisihan akan diselesaikan melalui musyawarah terlebih dahulu, kemudian melalui pengadilan yang berwenang atau prosedur arbitrase yang disepakati bersama.',
          ko: '본 계약은 인도네시아 법을 준거법으로 하며, 분쟁은 상호협의 후 관할 법원 또는 별도 합의한 중재절차에 따른다.',
        },
      ],
    },
  ];
}
