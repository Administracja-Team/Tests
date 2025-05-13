import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ProfilePage from '@/views/ProfilePage.vue';
import { useRouter } from 'vue-router';
import * as api from '@/services/api';

// Мокаем роутер
vi.mock('vue-router', () => ({
    useRouter: () => ({
        push: vi.fn()
    })
}));

// Мокаем API
vi.mock('@/services/api', () => ({
    getUserData: vi.fn()
}));

describe('ProfilePage.vue', () => {
    const mockUser = {
        name: 'John',
        surname: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        avatar: 'JD'
    };

    beforeEach(() => {
        api.getUserData.mockResolvedValue(mockUser);
    });

    it('fetches and displays user data on mount', async () => {
        const wrapper = mount(ProfilePage, {
            global: {
                stubs: ['Avatar', 'Button'] // PrimeVue компоненты
            }
        });

        await flushPromises(); // Ждем завершения fetch

        expect(api.getUserData).toHaveBeenCalled();
        expect(wrapper.text()).toContain(mockUser.name);
        expect(wrapper.text()).toContain(mockUser.username);
        expect(wrapper.text()).toContain(mockUser.email);
    });

    it('calls router.push on button click', async () => {
        const router = useRouter();
        const wrapper = mount(ProfilePage, {
            global: {
                stubs: ['Avatar', 'Button']
            }
        });

        await flushPromises();

        const button = wrapper.find('.menu-button');
        await button.trigger('click');

        expect(router.push).toHaveBeenCalledWith('/home');
    });
});
