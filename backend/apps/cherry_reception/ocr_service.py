"""
Servicio de OCR para extraer datos de fotos de básculas/relojes digitales
"""

import re
from PIL import Image, ImageEnhance, ImageFilter
import logging

logger = logging.getLogger(__name__)


class ScaleOCRService:
    """Servicio para extraer peso de fotos de básculas usando OCR"""
    
    @staticmethod
    def preprocess_image(image_path):
        """
        Pre-procesar imagen para mejorar precisión de OCR
        - Convertir a escala de grises
        - Aumentar contraste
        - Aplicar filtros para mejorar claridad
        """
        try:
            img = Image.open(image_path)
            
            # Convertir a escala de grises
            img = img.convert('L')
            
            # Aumentar contraste
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(2.0)
            
            # Aumentar nitidez
            img = img.filter(ImageFilter.SHARPEN)
            
            # Umbralización para binarizar la imagen
            threshold = 128
            img = img.point(lambda p: 255 if p > threshold else 0)
            
            return img
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            return None
    
    @staticmethod
    def extract_weight_from_text(text):
        """
        Extraer peso numérico del texto OCR
        Busca patrones comunes como:
        - 45.50
        - 45,50
        - 45.5 qq
        - 100.25 lbs
        """
        if not text:
            return None, 0.0
        
        # Limpiar el texto
        text = text.upper().replace(',', '.')
        
        # Patrones para buscar peso
        patterns = [
            r'(\d+\.\d+)\s*QQ',  # 45.50 QQ
            r'(\d+\.\d+)\s*QUINTALES',  # 45.50 QUINTALES
            r'(\d+)\s*QQ',  # 45 QQ
            r'(\d+\.\d+)\s*LBS',  # 100.50 LBS
            r'(\d+)\s*LBS',  # 100 LBS
            r'(\d+\.\d+)',  # Cualquier número decimal
            r'(\d+)',  # Cualquier número entero
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    weight = float(match.group(1))
                    
                    # Si es en libras, convertir a quintales
                    if 'LBS' in text or 'LIBRAS' in text:
                        weight = weight / 100  # Convertir lbs a qq
                    
                    # Validar que el peso sea razonable (entre 0.1 y 1000 qq)
                    if 0.1 <= weight <= 1000:
                        return weight, 85.0  # Retornar peso y confianza del 85%
                except ValueError:
                    continue
        
        return None, 0.0
    
    @classmethod
    def extract_weight_from_image(cls, image_path):
        """
        Extraer peso de una imagen de báscula
        
        Args:
            image_path: Ruta a la imagen
        
        Returns:
            dict con 'weight', 'confidence', 'raw_text'
        """
        try:
            # Intentar importar pytesseract
            try:
                import pytesseract
            except ImportError:
                logger.warning("pytesseract not installed, using fallback method")
                return cls._fallback_extraction(image_path)
            
            # Pre-procesar imagen
            processed_img = cls.preprocess_image(image_path)
            if not processed_img:
                return {
                    'weight': None,
                    'confidence': 0.0,
                    'raw_text': '',
                    'error': 'Failed to preprocess image'
                }
            
            # Extraer texto con OCR
            try:
                raw_text = pytesseract.image_to_string(
                    processed_img,
                    config='--psm 6 --oem 3'  # PSM 6 = assume uniform block of text
                )
            except Exception as ocr_error:
                logger.error(f"OCR extraction failed: {ocr_error}")
                return cls._fallback_extraction(image_path)
            
            # Extraer peso del texto
            weight, confidence = cls.extract_weight_from_text(raw_text)
            
            return {
                'weight': weight,
                'confidence': confidence,
                'raw_text': raw_text.strip(),
                'success': weight is not None
            }
            
        except Exception as e:
            logger.error(f"Error extracting weight from image: {e}", exc_info=True)
            return {
                'weight': None,
                'confidence': 0.0,
                'raw_text': '',
                'error': str(e)
            }
    
    @classmethod
    def _fallback_extraction(cls, image_path):
        """
        Método de fallback cuando pytesseract no está disponible
        Retorna datos vacíos para que el usuario ingrese manualmente
        """
        return {
            'weight': None,
            'confidence': 0.0,
            'raw_text': 'OCR no disponible - ingrese peso manualmente',
            'manual_required': True
        }
    
    @staticmethod
    def validate_weight(weight_qq):
        """Validar que el peso esté en un rango razonable"""
        if not weight_qq:
            return False, "Peso es requerido"
        
        try:
            weight = float(weight_qq)
            if weight < 0.1:
                return False, "Peso muy bajo (mínimo 0.1 qq)"
            if weight > 1000:
                return False, "Peso muy alto (máximo 1000 qq)"
            return True, "Peso válido"
        except (ValueError, TypeError):
            return False, "Peso inválido"

