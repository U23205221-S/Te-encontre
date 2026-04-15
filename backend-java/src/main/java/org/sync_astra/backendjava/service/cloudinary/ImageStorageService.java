package org.sync_astra.backendjava.service.cloudinary;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class ImageStorageService {

    private final Cloudinary cloudinary;

    public ImageStorageService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String uploadImage(MultipartFile file, String folderName) throws IOException {
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "syncastra/" + folderName,
                        "resource_type", "auto"
                ));

        return uploadResult.get("url").toString();
    }
}