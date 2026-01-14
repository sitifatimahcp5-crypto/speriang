
import React from 'react';
import { Page } from '../types';
import Card from './Card';
import { PresentationChartBarIcon, CubeTransparentIcon, CurrencyDollarIcon, VideoCameraIcon } from './icons/Icons';

interface HomeProps {
  setCurrentPage: (page: Page) => void;
}

const Home: React.FC<HomeProps> = ({ setCurrentPage }) => {
  const features = [
    { icon: <CubeTransparentIcon className="w-8 h-8 text-indigo-400" />, title: "1. Siapkan Aset", description: "Siapkan semua aset digital Anda: buat avatar AI, unggah foto produk, dan tambahkan lokasi latar." },
    { icon: <PresentationChartBarIcon className="w-8 h-8 text-indigo-400" />, title: "2. Buat Konten Iklan", description: "Gabungkan aset untuk membuat storyboard, gambar adegan, dan prompt video VEO yang siap pakai secara otomatis." },
    { icon: <VideoCameraIcon className="w-8 h-8 text-indigo-400" />, title: "3. Produksi Video", description: "Salin prompt VEO yang dihasilkan dan gunakan di platform video AI untuk membuat video final yang memukau." },
    { icon: <CurrencyDollarIcon className="w-8 h-8 text-indigo-400" />, title: "4. Posting & Cuan!", description: "Unggah video iklan Anda ke media sosial, jalankan kampanye, dan saksikan konversi penjualan Anda meningkat." }
  ];

  return (
    <div className="space-y-10">
      <div className="text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500">
            Cara Mudah Bikin Video AI
          </h1>
          <p className="mt-6 text-lg text-gray-300">
            Ubah ide Anda menjadi video profesional dengan bantuan avatar AI. Cepat, mudah, dan tanpa perlu syuting.
          </p>
        </div>

        <div className="max-w-5xl mx-auto mt-16">
          <h2 className="text-3xl font-bold mb-8">Alur Kerja Sederhana</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 text-left hover:border-indigo-500 transition-colors">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
