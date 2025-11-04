"""
Servicio de OCR para extraer rendimiento y peso de vales de transformación
"""

import re
from PIL import Image, ImageEnhance, ImageFilter
import logging

logger = logging.getLogger(__name__)


class VoucherOCRService:
    """Servicio para extraer rendimiento y peso de vales usando OCR"""
    
    @staticmethod
    def preprocess_image(image_path):
        """Pre-procesar imagen del vale para mejorar OCR"""
        try:
            img = Image.open(image_path)
            
            # Convertir a escala de grises
            img = img.convert('L')
            
            # Aumentar contraste
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(2.5)
            
            # Aumentar nitidez
            img = img.filter(ImageFilter.SHARPEN)
            img = img.filter(ImageFilter.SHARPEN)  # Doble sharpen para vales
            
            # Umbralización
            threshold = 140
            img = img.point(lambda p: 255 if p > threshold else 0)
            
            return img
        except Exception as e:
            logger.error(f"Error preprocessing voucher image: {e}")
            return None
    
    @staticmethod
    def extract_weight_from_text(text):
        """
        Extraer peso del texto OCR
        Busca patrones como: 45.50 qq, 100.25 lbs, PESO: 45.5
        """
        if not text:
            return None, 0.0
        
        text = text.upper().replace(',', '.')
        
        patterns = [
            r'PESO[:\s]*(\d+\.?\d*)\s*QQ',
            r'PESO[:\s]*(\d+\.?\d*)\s*QUINTALES',
            r'PERGAMINO[:\s]*(\d+\.?\d*)\s*QQ',
            r'(\d+\.?\d*)\s*QQ',
            r'(\d+\.?\d*)\s*QUINTALES',
            r'PESO[:\s]*(\d+\.?\d*)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    weight = float(match.group(1))
                    if 0.1 <= weight <= 1000:
                        return weight, 80.0
                except ValueError:
                    continue
        
        return None, 0.0
    
    @staticmethod
    def extract_yield_from_text(text):
        """
        Extraer rendimiento del texto OCR
        Busca patrones como: 18.5%, RENDIMIENTO: 20, RTO: 18.5
        """
        if not text:
            return None, 0.0
        
        text = text.upper().replace(',', '.')
        
        patterns = [
            r'RENDIMIENTO[:\s]*(\d+\.?\d*)\s*%',
            r'REND[:\s]*(\d+\.?\d*)\s*%',
            r'RTO[:\s]*(\d+\.?\d*)\s*%',
            r'RENDIMIENTO[:\s]*(\d+\.?\d*)',
            r'RTO[:\s]*(\d+\.?\d*)',
            r'(\d+\.?\d*)\s*%\s*REND',
            r'%\s*(\d+\.?\d*)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    yield_val = float(match.group(1))
                    # Rendimiento típico: 15-25%
                    if 5.0 <= yield_val <= 50.0:
                        return yield_val, 75.0
                except ValueError:
                    continue
        
        return None, 0.0
    
    @classmethod
    def extract_data_from_voucher(cls, image_path):
        """
        Extraer rendimiento y peso de una imagen de vale
        
        Returns:
            dict con 'weight', 'weight_confidence', 'yield', 'yield_confidence', 'raw_text'
        """
        try:
            # Intentar importar pytesseract
            try:
                import pytesseract
            except ImportError:
                logger.warning("pytesseract not installed, using fallback")
                return cls._fallback_extraction()
            
            # Pre-procesar imagen
            processed_img = cls.preprocess_image(image_path)
            if not processed_img:
                return {
                    'weight': None,
                    'weight_confidence': 0.0,
                    'yield_percentage': None,
                    'yield_confidence': 0.0,
                    'raw_text': '',
                    'error': 'Failed to preprocess image'
                }
            
            # Extraer texto con OCR
            try:
                raw_text = pytesseract.image_to_string(
                    processed_img,
                    config='--psm 6 --oem 3',
                    lang='spa+eng'  # Español e inglés
                )
            except Exception as ocr_error:
                logger.error(f"OCR extraction failed: {ocr_error}")
                return cls._fallback_extraction()
            
            # Extraer peso
            weight, weight_conf = cls.extract_weight_from_text(raw_text)
            
            # Extraer rendimiento
            yield_val, yield_conf = cls.extract_yield_from_text(raw_text)
            
            return {
                'weight': weight,
                'weight_confidence': weight_conf,
                'yield_percentage': yield_val,
                'yield_confidence': yield_conf,
                'raw_text': raw_text.strip(),
                'success': weight is not None and yield_val is not None,
                'partial_success': weight is not None or yield_val is not None
            }
            
        except Exception as e:
            logger.error(f"Error extracting data from voucher: {e}", exc_info=True)
            return {
                'weight': None,
                'weight_confidence': 0.0,
                'yield_percentage': None,
                'yield_confidence': 0.0,
                'raw_text': '',
                'error': str(e)
            }
    
    @classmethod
    def _fallback_extraction(cls):
        """Fallback cuando OCR no está disponible"""
        return {
            'weight': None,
            'weight_confidence': 0.0,
            'yield_percentage': None,
            'yield_confidence': 0.0,
            'raw_text': 'OCR no disponible - ingrese datos manualmente',
            'manual_required': True
        }
    
    @staticmethod
    def validate_yield(yield_percentage):
        """Validar que el rendimiento esté en rango razonable"""
        if not yield_percentage:
            return False, "Rendimiento es requerido"
        
        try:
            yield_val = float(yield_percentage)
            if yield_val < 5.0:
                return False, "Rendimiento muy bajo (mínimo 5%)"
            if yield_val > 50.0:
                return False, "Rendimiento muy alto (máximo 50%)"
            if yield_val < 15.0 or yield_val > 25.0:
                return True, f"⚠️ Rendimiento {yield_val}% fuera del rango típico (15-25%)"
            return True, "Rendimiento válido"
        except (ValueError, TypeError):
            return False, "Rendimiento inválido"

