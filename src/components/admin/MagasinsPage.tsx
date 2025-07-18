import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Store, MapPin, Save, X } from 'lucide-react';
import { storesService } from '../../services/api';
import { Magasin } from '../../types';
import { MapSelector } from '../MapSelector';
import { ImageUpload } from '../ImageUpload';
import toast from 'react-hot-toast';

export const MagasinsPage: React.FC = () => {
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMagasin, setEditingMagasin] = useState<Magasin | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    latitude: 33.5731, // Casablanca par défaut
    longitude: -7.5898,
    image: null as File | null
  });

  useEffect(() => {
    fetchMagasins();
  }, []);

  const fetchMagasins = async () => {
    try {
      const data = await storesService.getStores();
      setMagasins(data.map((item: any) => ({
        ...item,
        createdAt: new Date(item.created_at)
      })));
    } catch (error) {
      toast.error('Erreur lors du chargement des magasins');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const magasinData = {
        nom: formData.nom,
        adresse: formData.adresse,
        latitude: formData.latitude,
        longitude: formData.longitude,
        image: formData.image
      };

      if (editingMagasin) {
        await storesService.updateStore(editingMagasin.id, magasinData);
        toast.success('Magasin modifié avec succès');
      } else {
        await storesService.createStore(magasinData);
        toast.success('Magasin ajouté avec succès');
      }

      resetForm();
      fetchMagasins();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (magasin: Magasin) => {
    setEditingMagasin(magasin);
    setFormData({
      nom: magasin.nom,
      adresse: magasin.adresse,
      latitude: magasin.latitude,
      longitude: magasin.longitude,
      image: null
    });
    setShowModal(true);
  };

  const handleDelete = async (magasin: Magasin) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce magasin ?')) return;

    try {
      await storesService.deleteStore(magasin.id);
      toast.success('Magasin supprimé avec succès');
      fetchMagasins();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      adresse: '',
      latitude: 33.5731,
      longitude: -7.5898,
      image: null
    });
    setEditingMagasin(null);
    setShowModal(false);
  };

  const handlePositionChange = (lat: number, lng: number) => {
    setFormData({
      ...formData,
      latitude: lat,
      longitude: lng
    });
  };

  const filteredMagasins = magasins.filter(magasin =>
    magasin.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    magasin.adresse.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && magasins.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Magasins</h1>
          <p className="text-gray-600 mt-1">Gérez vos points de vente</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nouveau Magasin</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Rechercher par nom ou adresse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Magasins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMagasins.map((magasin) => (
          <div key={magasin.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            {/* Image */}
            <div className="h-48 bg-gray-100 relative">
              {magasin.image_url ? (
                <img
                  src={`http://localhost:8000${magasin.image_url}`}
                  alt={magasin.nom}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store className="h-16 w-16 text-gray-400" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex space-x-1">
                <button
                  onClick={() => handleEdit(magasin)}
                  className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200"
                >
                  <Edit className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDelete(magasin)}
                  className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Store className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{magasin.nom}</h3>
                  <p className="text-sm text-gray-600">Créé le {magasin.createdAt.toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-600">{magasin.adresse}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Coordonnées GPS</p>
                  <p className="text-sm font-mono text-gray-700">
                    {magasin.latitude.toFixed(6)}, {magasin.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMagasins.length === 0 && (
        <div className="text-center py-12">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun magasin trouvé</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Aucun magasin ne correspond à votre recherche.' : 'Commencez par ajouter votre premier magasin.'}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingMagasin ? 'Modifier le Magasin' : 'Nouveau Magasin'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom du magasin *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nom}
                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Magasin Centre-Ville"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse complète *
                      </label>
                      <textarea
                        required
                        value={formData.adresse}
                        onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Ex: 123 Rue Mohammed V, Casablanca"
                      />
                    </div>

                    <ImageUpload
                      currentImage={editingMagasin?.image_url ? `http://localhost:8000${editingMagasin.image_url}` : undefined}
                      onImageChange={(file) => setFormData({ ...formData, image: file })}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Latitude *
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={formData.latitude}
                          onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: 33.5731"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Longitude *
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: -7.5898"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Localisation sur la carte
                    </label>
                    <p className="text-sm text-gray-500 mb-4">
                      Cliquez sur la carte pour définir la position exacte du magasin
                    </p>
                    <MapSelector
                      initialPosition={{ lat: formData.latitude, lng: formData.longitude }}
                      onPositionChange={handlePositionChange}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingMagasin ? 'Modifier' : 'Ajouter'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
